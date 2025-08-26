import requests
import json

# Create first admin user
admin_data = {
    "name": "Admin User",
    "email": "admin@pageflip.com",  # Change this to your preferred admin email
    "password": "admin123",         # Change this to a secure password
    "phone": "+1234567890",
    "address": "Admin Office"
}

try:
    response = requests.post('http://127.0.0.1:5000/create-admin', json=admin_data)
    
    if response.status_code == 201:
        print("✅ Admin user created successfully!")
        print(f"Email: {admin_data['email']}")
        print(f"Password: {admin_data['password']}")
        print("\nYou can now login at: http://localhost:4200/admin/login")
    else:
        print("❌ Error creating admin user:")
        print(response.json())
        
except requests.exceptions.ConnectionError:
    print("❌ Error: Could not connect to Flask backend.")
    print("Make sure your Flask server is running on http://127.0.0.1:5000")
except Exception as e:
    print(f"❌ Error: {e}")
