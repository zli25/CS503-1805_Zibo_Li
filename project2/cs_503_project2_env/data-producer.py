import argparse
import atexit
import json
import logging
import requests
import schedule
import time

from kafka import KafkaProducer
from kafka.errors import KafkaError

logger_format = "%(asctime)s - %(message)s"
logging.basicConfig(format=logger_format)
logger = logging.getLogger('data-producer')
logger.setLevel(logging.DEBUG)

API_BASE = 'https://api.gdax.com'

SUPPORTED_SYMBOL = ['BTC-USD', 'LTC-USD', 'ETH-USD']


def check_symbol(symbol):
    """
    Helper method checks if the symbol is supported and exists in coinbase API.
    """
    logger.debug('Checking symbol.')
    if symbol not in SUPPORTED_SYMBOL:
        logger.warning('Symbol %s is not supported. The list of supported symbols %s' % (symbol, SUPPORTED_SYMBOL))
        exit()
    try:
        response = requests.get(API_BASE + '/products')
        product_ids = [product['id'] for product in response.json()]

        if symbol not in product_ids:
            logger.error('Supported symbol %s doesn\'t exist. The list of supported symbols: %s', symbol, product_ids)
            exit()
    except Exception as e:
        logger.warning('Failed to fetch products: %s', e)


def fetch_price(symbol, producer, topic_name):
    """
    Helper function to retrieve data and send it to kafka.
    """
    logger.debug('Start to fetch prices for %s', symbol)
    try:
        response = requests.get('%s/products/%s/ticker' % (API_BASE, symbol))
        price = response.json()['price']

        timestamp = time.time()
        payload = {
            'Symbol': str(symbol),
            'LastTradePrice': str(price),
            'Timestamp': str(timestamp)
        }

        logger.debug('Retrieved %s info %s', symbol, payload)
        producer.send(topic=topic_name, value=json.dumps(payload).encode('utf-8'))
        logger.info('Sent price for %s to kafka', symbol)
    except KafkaError as kafka_error:
        logger.warning('Failed to send messages to kafka, caused by: %s', kafka_error)
    except Exception as e:
        logger.warning('Failed to fetch price: %s', e)


def shutdown_hook(producer):
    try:
        producer.flush(10)
    except KafkaError as kafka_error:
        logger.warning('Failed to flush pending messages to kafka, caused by: %s', kafka_error)
    finally:
        try:
            producer.close(10)
        except Exception as e:
            logger.warning('Failed to close kafka connection, cased by %s', e)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('symbol', help='the symbol you want to pull.')
    parser.add_argument('topic_name', help='the kafka topic push to.')
    parser.add_argument('kafka_broker', help='the location of kafka broker.')

    # Parse arguments.
    args = parser.parse_args()
    symbol = args.symbol
    topic_name = args.topic_name
    kafka_broker = args.kafka_broker

    # Check if the symbol is supported.
    check_symbol(symbol)

    # Intantiate a simple kafka producer.
    producer = KafkaProducer(bootstrap_servers=kafka_broker)

    # Schedule and run the fetch_price function every one second.
    schedule.every(1).seconds.do(fetch_price, symbol, producer, topic_name)

    # Setup propper shutdown hook.
    atexit.register(shutdown_hook, producer)

    while True:
        schedule.run_pending()
        time.sleep(1)
