import argparse
import atexit
import json
import logging
import happybase
import requests
import schedule
import time

from kafka import KafkaProducer
from kafka.errors import KafkaError

logger_format = "%(asctime)s - %(message)s"
logging.basicConfig(format=logger_format)
logger = logging.getLogger('data-producer')
logger.setLevel(logging.DEBUG)


def shutdown_hook(producer, connection):
    """
    a shutdown hook to be called before the shutdown
    """
    try:
        logger.info('Closing Kafka producer')
        producer.flush(10)
        producer.close()
        logger.info('Kafka producer closed')
        logger.info('Closing Hbase Connection')
        connection.close()
        logger.info('Hbase Connection closed')
    except KafkaError as kafka_error:
        logger.warn('Failed to close Kafka producer, caused by: %s', kafka_error.message)
    finally:
        logger.info('Existing program')


def read_data(hbase_connection, data_table):
    """
    persist data to hbase
    """
    try:
        logger.debug('Start to persist dat to hbase: %s', data)
        parsed = json.loads(data)
        symbol = parsed.get('Symbol')
        price = parsed.get('LastTradePrice')
        timestamp = parsed.get('Timestamp')

        table = hbase_connection.table(data_table)
        row_key = "%s-%s" % (symbol, timestamp)
        table.put(row_key, {'family:symbol': symbol,
                            'family:trade_time': timestamp,
                            'family:trade_price': price})

        logger.info('Persisted data to hbase for symbol: %s, price: %s, timestamp: %s', symbol, price, timestamp)

    except Exception as e:
        logger.error('Failed to persist data to hbase for %s', e)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('topic_name')
    parser.add_argument('kafka_broker')
    parser.add_argument('data_table')
    parser.add_argument('hbase_host')

    # Parse arguments.
    args = parser.parse_args()
    topic_name = args.topic_name
    kafka_broker = args.kafka_broker
    data_table = args.data_table
    hbase_host = args.hbase_host

    hbase_connection = happybase.Connection(hbase_host)

    kafka_producer = KafkaProducer(bootstrap_servers=kafka_broker)

    # Create table if not exists.
    hbase_tables = [table.decode() for table in hbase_connection.tables()]
    if data_table not in hbase_tables:
        logger.error('Table %s doesn\'t exist', data_table)

    # Setup proper shutdown hook.
    atexit.register(shutdown_hook, kafka_producer, hbase_connection)

    # Start reading data from hbase.
    table = hbase_connection.table(data_table)
    try:
        for key, data in table.scan():
            payload = {
                'Symbol': data[b'family:symbol'].decode(),
                'LastTradePrice': data[b'family:trade_price'].decode(),
                'Timestamp': data[b'family:trade_time'].decode()
            }

            logger.debug('Read data from hbase: %s', payload)
            try:
                kafka_producer.send(topic=topic_name, value=json.dumps(payload).encode('utf-8'))
            except KafkaError as kafka_error:
                logger.warning('Failed to send messages to kafka, caused by: %s', kafka_error)

            time.sleep(1)
    except Exception as e:
        logger.error('Failed to read data from hbase for %s', e)
