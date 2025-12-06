# For building docs manually you need 
- python3 
- mkdocs 
- mkdocs-material installed

## MacOS
Install brew from https://brew.sh
```bash
brew install mkdocs
brew install mkdocs-material
```

## Windows
Install python3 from https://www.python.org/downloads 
```bash
pip3 install mkdocs
pip3 install mkdocs-material --user
```
## Linux

1.  Linux **without** external managed environment
```bash
pip3 install mkdocs
pip3 install mkdocs-material --user
```
2.  Linux **with** external managed environment
```bash
pipx install mkdocs
pipx inject mkdocs mkdocs-material
```
---
### if you don't have pip3 installed on linux
```bash 
sudo apt update # UBUNTU/DEBIAN ONLY
sudo apt install python3-pip # UBUNTU/DEBIAN ONLY
# or
sudo dnf install python3-pip # FEDORA ONLY
# or 
sudo pacman -S python-pip # ARCH
```

### if you don't have pipx installed on linux
Only needed on debian/ubuntu 
(if external-managed-environment problem and you can do pip3 install mkdocs)
```bash
sudo apt install pipx
```
