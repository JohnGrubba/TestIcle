#!/bin/bash

OS=$(uname -s)

echo "[*] Checking if Node was installed"

if [ "$OS" == "Linux" ]; then
  if [ "$(dpkg -s nodejs 2>/dev/null | grep Status)" != "Status: install ok installed" ]; then
    echo "[-] Node is not installed. Please download node using apt install nodejs"
  else 
  echo "[*]Node is installed"
  fi
  else
  echo "[-] This setup-script is not supported on you os. Please use the setup.bat" 
  return 1
fi

echo "[*] Installing dependencies of Node.js"
npm i