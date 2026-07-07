import os
from sqlalchemy import create_engine
import sys
import traceback

with open("test_out.txt", "w") as f:
    try:
        db_path = os.path.abspath('yuklenenler/ornek.db')
        # Let's try 3 slashes with absolute path (SQLAlchemy docs say 4 slashes for absolute on Windows, e.g. sqlite:////C:/path)
        # Wait, SQLAlchemy docs:
        # sqlite:////absolute/path/to/foo.db
        # On Windows:
        # sqlite:///C:\\path\\to\\foo.db
        
        conn_str = f"sqlite:///{db_path}"
        f.write(f"Connection string: {conn_str}\n")
        engine = create_engine(conn_str)
        conn = engine.connect()
        f.write(f"Connection successful: {conn}\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
        f.write(traceback.format_exc())
