from werkzeug.security import generate_password_hash
import mysql.connector



# Generate correct hash
correct_hash = generate_password_hash('admin123')
print(f"Correct hash: {correct_hash}")

