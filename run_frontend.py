#!/usr/bin/env python3
"""
Simple server to run the Kalongo Farm frontend website
"""
import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

# Change to frontend directory
frontend_dir = Path(__file__).parent / "frontend"
os.chdir(frontend_dir)

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for API calls
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        # Suppress verbose logging
        pass

def find_free_port(start_port=8000):
    """Find a free port starting from start_port"""
    import socket
    for port in range(start_port, start_port + 10):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    return start_port

def main():
    global PORT
    PORT = find_free_port(PORT)
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}/index.html"
            print("=" * 60)
            print("🌿 KALONGO FARM - Frontend Server")
            print("=" * 60)
            print(f"✅ Server running on: {url}")
            print(f"📁 Serving from: {frontend_dir}")
            print("\n⚠️  Make sure backend is running on http://localhost:5001")
            print("   (Run: cd backend && python app.py)")
            print("\n🌐 Opening browser...")
            print("=" * 60)
            
            # Open browser automatically
            webbrowser.open(url)
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n\n✅ Server stopped. Goodbye!")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"⚠️  Port {PORT} is already in use.")
            print(f"   Another server might be running, or try a different port.")
            print(f"   You can access the website at: http://localhost:{PORT}/index.html")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
