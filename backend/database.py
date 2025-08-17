# Database compatibility layer for SQLAlchemy
# This file provides compatibility between the old SQLAlchemy implementation and the current mysql-connector-python implementation

from shared.models import execute_query as mysql_execute_query
import logging

# Setup logging
logger = logging.getLogger('database')

def execute_query_pooled(query, params=None, fetch_one=False, fetch_all=False, get_insert_id=False):
    """
    Compatibility function for SQLAlchemy-style execute_query_pooled
    This redirects to the mysql-connector-python implementation
    """
    try:
        # Convert SQLAlchemy-style parameters to mysql-connector format
        if params and isinstance(params, dict):
            # Convert named parameters to positional parameters
            # This is a simplified conversion - adjust as needed
            logger.warning(f"Converting dict parameters to tuple for query: {query[:100]}...")
            # For now, just pass as is and let mysql-connector handle it
            pass
        
        return mysql_execute_query(query, params, fetch_one, fetch_all, get_insert_id)
        
    except Exception as e:
        logger.error(f"Query execution failed: {query[:100]}... Error: {e}")
        raise e

def get_db_connection():
    """
    Compatibility function for database connection
    """
    try:
        from shared.models import get_db_connection as mysql_get_connection
        return mysql_get_connection()
    except Exception as e:
        logger.error(f"Database connection failed after 3 attempts: {e}")
        raise e