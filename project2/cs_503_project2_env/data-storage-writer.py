import argparse
import atexit
import json
import logging
import happybase
import requests
import schedule
import time

from kafka import KafkaConsumer

logger_format = "%(asctime)s - %(message)s"
logging.basicConfig(format=logger_format)
logger = logging.getLogger('data-producer')
logger.setLevel(logging.DEBUG)


def shutdown_hook(kafka_consumer, hbase_connection):
    """
    A shutdown hook to be called before the shutdown.
    """
    try:
        kafka_consumer.close()
        hbase_connection.close()
    except Exception as e:
        logger.warn('Failed to close kafka consumer or hbase connection for %s', e)


def persist_data(data, hbase_connection, data_table):
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

    kafka_consumer = KafkaConsumer(topic_name, bootstrap_servers=kafka_broker)

    # Create table if not exists.
    hbase_tables = [table.decode() for table in hbase_connection.tables()]
    if data_table not in hbase_tables:
        hbase_connection.create_table(data_table, {'family': dict()})

    # Setup proper shutdown hook.
    atexit.register(shutdown_hook, kafka_consumer, hbase_connection)

    # Start consuming kafka and writing to hbase.
    for msg in kafka_consumer:
        persist_data(msg.value, hbase_connection, data_table)
