# Server Deployment Setup Guide

This guide explains how to login to the server as root from Windows CMD and setup the server for Git-based deployment.

## Prerequisites

- Windows Command Prompt or PowerShell
- Server credentials:
  - IP Address: `159.198.36.64`
  - Port: `22`
  - Username: `root`
  - Password: `oe2kHJ3l9VN6Qf1u6W`
- Git account credentials:
  - Email: `oday.qr.2001@gmail.com`
  - Password: `KILLTOHEALkito@26V1`

## 1. Login as Root via CMD (Windows)

### From Command Prompt or PowerShell:

```bash
ssh root@159.198.36.64
```

**Note:** Port 22 is the default SSH port, so you don't need to specify it unless it's different.

1. When prompted, enter the root password: `oe2kHJ3l9VN6Qf1u6W`
2. If you see a fingerprint confirmation message like:
   ```
   The authenticity of host '159.198.36.64' can't be established.
   Are you sure you want to continue connecting (yes/no)?
   ```
   Type `yes` and press Enter.

### Alternative: Using PowerShell with explicit port

```powershell
ssh -p 22 root@159.198.36.64
```

### Troubleshooting

If SSH connection fails or password login is blocked:

1. **Check VPS Panel:**
   - Ensure SSH service is enabled
   - Verify root login is allowed (some servers disable root SSH by default)
   - Check firewall settings

2. **Use VNC/Console Access:**
   - Login via VNC from the VPS panel
   - Access server console directly
   - Verify SSH service is running: `systemctl status sshd`

3. **Enable Root Login (if disabled):**
   ```bash
   # Edit SSH config (via console/VNC)
   nano /etc/ssh/sshd_config
   # Ensure: PermitRootLogin yes
   # Then restart SSH: systemctl restart sshd
   ```

## 2. Initial Server Setup (One-Time)

Once logged in, update the system and install required tools:

### Update System Packages

```bash
apt update && apt upgrade -y
```

### Install Essential Tools

```bash
apt install -y git curl wget
```

### Install Node.js (Node 20 LTS - Recommended)

```bash
# Add NodeSource repository for Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js
apt install -y nodejs

# Verify installation
node -v
npm -v
```

**Note:** Node.js 18.x is deprecated. Use Node.js 20 LTS or 22.x for active support and security updates.

**Alternative:** Install Node.js via NVM (Node Version Manager) for easier version management:

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20 LTS (recommended)
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node -v
npm -v
```

**Alternative Versions:**
- For Node.js 22.x: `curl -fsSL https://deb.nodesource.com/setup_22.x | bash -`
- For Node.js 22 via NVM: `nvm install 22 && nvm use 22`

## 3. Setup SSH Access for GitHub (Important)

Since your deployment uses SSH-based Git repository, you need to setup SSH keys to authenticate with GitHub.

**Important:** You're using **GitHub** (not GitLab). Your GitHub account email is `oday.qr.2001@gmail.com`.

### Generate SSH Key Pair

```bash
# Generate SSH key with your Git account email (recommended)
ssh-keygen -t ed25519 -C "oday.qr.2001@gmail.com"

# Or if ed25519 is not supported, use RSA
ssh-keygen -t rsa -b 4096 -C "oday.qr.2001@gmail.com"
```

**⚠️ IMPORTANT - Follow these steps carefully:**

When you run the command above, you will see prompts like this:

```
Generating public/private ed25519 key pair.
Enter file in which to save the key (/root/.ssh/id_ed25519):
```

1. **For the file location prompt:** Simply press **Enter** (do NOT type anything, just press Enter to use the default path)
2. **For the passphrase prompt:** Press **Enter** twice (once for passphrase, once to confirm - this creates a key without a passphrase for easier automation)

**Common Mistake:** Do NOT type `cat ~/.ssh/id_ed25519.pub` at the file location prompt. That command is run AFTER the key is generated, not during.

The `-C` flag adds a comment with your email address, which helps identify the key.

### Display Public Key

**⚠️ Only run these commands AFTER successfully generating the SSH key:**

```bash
# Display the public key to add to Git server
cat ~/.ssh/id_ed25519.pub

# Or if using RSA
cat ~/.ssh/id_rsa.pub
```

Copy the entire output (starts with `ssh-ed25519` or `ssh-rsa`). You'll need this to add to your Git server in the next step.

**If you see "No such file or directory" error:**
- This means the SSH key generation failed or wasn't completed
- Run `ssh-keygen` again and make sure to press Enter (not type anything) when prompted for the file location

### Your SSH Public Key (Saved for Reference)

**Server SSH Public Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHqEByrZQj5Xc0oJNJwPXb6fKOZ8f4t4suyj0j2qDsye oday.qr.2001@gmail.com
```

This is your server's public SSH key that you need to add to GitHub. Copy this entire key when adding it to your GitHub account.

### Add SSH Key to GitHub

1. **Login to GitHub:**
   - Go to [https://github.com](https://github.com)
   - Login with your GitHub account:
     - **Email:** `oday.qr.2001@gmail.com`
     - **Password:** `KILLTOHEALkito@26V1`

2. **Navigate to SSH Keys Settings:**
   - Click your profile picture (top right) → **Settings**
   - In the left sidebar, click **SSH and GPG keys**
   - Click **New SSH key** button (green button)

3. **Add Your SSH Key:**
   - **Title:** Enter a descriptive name (e.g., "Server1 - Production Server" or "Deployment Key")
   - **Key type:** Leave as "Authentication Key"
   - **Key:** Paste your entire public key (the output from `cat ~/.ssh/id_ed25519.pub`)
     - It should start with `ssh-ed25519` or `ssh-rsa`
     - Make sure to copy the ENTIRE key, including the email at the end

4. **Save the Key:**
   - Click **Add SSH key** button
   - You may be prompted to enter your GitHub password for confirmation
   - Your key will now be added to your GitHub account

### Configure Git Credentials (Alternative: HTTPS Access)

If you prefer to use HTTPS-based Git operations instead of SSH:

```bash
# Configure Git user information
git config --global user.name "Your Name"
git config --global user.email "oday.qr.2001@gmail.com"

# Configure credential helper to store credentials
git config --global credential.helper store

# When you clone/pull, use HTTPS URL format:
# https://github.com/username/repository.git
# Enter credentials when prompted:
# Username: oday.qr.2001@gmail.com
# Password: KILLTOHEALkito@26V1
```

**Note:** For SSH-based deployment (recommended), SSH keys are the preferred method as they're more secure than password authentication. However, if you're using a deployment script, SSH keys are typically required.

### Test SSH Connection to GitHub

```bash
# Test connection to GitHub (git@ is the SSH protocol, not an email)
ssh -T git@github.com

# You should see a success message like:
# "Hi oday.qr.2001! You've successfully authenticated, but GitHub does not provide shell access."
```

**Note:** The `git@github.com` is GitHub's SSH hostname. The `git@` is the SSH username for Git operations on GitHub. This is different from your GitHub account email (`oday.qr.2001@gmail.com`).

If you see the success message above, your SSH key is working correctly and you can now clone/pull from your GitHub repositories.

## 4. Setup Deployment Directory

### Create Web Root Directory (If Not Exists)

The `/var/www/` directory may not exist on a fresh server. Create it first:

```bash
# Create the /var/www directory if it doesn't exist
mkdir -p /var/www/

# Set proper permissions (optional but recommended)
chmod 755 /var/www/
```

### Navigate to Web Root

```bash
cd /var/www/
```

**If you get "No such file or directory" error:**
- This means `/var/www/` doesn't exist yet
- Run `mkdir -p /var/www/` first to create it
- Then you can navigate to it with `cd /var/www/`

### Clone Repository (First Time - Optional)

If you want to manually clone first, use your GitHub repository SSH URL:

```bash
# Clone your GitHub repository
git clone git@github.com:obada404/e-com.git e-com

# Or use HTTPS format:
# git clone https://github.com/obada404/e-com.git e-com

# Navigate into the directory
cd e-com
```

**Your GitHub repository:**
- **SSH URL:** `git@github.com:obada404/e-com.git`
- **HTTPS URL:** `https://github.com/obada404/e-com.git`
- **Repository:** [https://github.com/obada404/e-com](https://github.com/obada404/e-com)

## 5. Manual Deployment (Your Repository Doesn't Have deploy-nest.js)

**Note:** Your repository doesn't include a `deploy-nest.js` script. You can deploy manually using the steps below.

### Clone Your Repository

```bash
cd /var/www/
# Clone your GitHub repository
git clone git@github.com:obada404/e-com.git e-com
cd e-com
```

### Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

### Setup Environment Variables

Create a `.env` file in your project directory:

```bash
# Create .env file
nano .env
```

Add your environment variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

# Cloudflare R2 Storage Configuration (if using)
STORAGE_DRIVER=r2
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL_BASE=https://pub-your-account-id.r2.dev
```

Save and exit (Ctrl+X, then Y, then Enter).

## 6. Deploy Application

### Option A: Using Docker (Recommended)

Your repository includes Docker support. Use Docker Compose:

```bash
cd /var/www/e-com

# Build and start containers
docker-compose up -d --build

# Check if containers are running
docker ps

# View logs
docker-compose logs -f
```

**Before running Docker:**
- Make sure Docker is installed (see "Install Docker" section below)
- Update `docker-compose.yml` with your database credentials if needed

### Option B: Manual Build and Run

If you prefer not to use Docker:

```bash
cd /var/www/e-com

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database (optional)
npm run prisma:seed

# Build the application
npm run build

# Start the application (choose one method below)
```

**Start with Node.js directly:**
```bash
# Start production server
npm run start:prod

# Or use PM2 for process management (see PM2 section below)
pm2 start dist/main.js --name e-com
```

**Start with PM2 (Recommended for production):**
```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start application
pm2 start dist/main.js --name e-com

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Your deployment information:**
- **Repository:** `git@github.com:obada404/e-com.git`
- **Branch:** `main`
- **Project Directory:** `/var/www/e-com`
- **Default Port:** 3000 (check your `src/main.ts` or environment variables)

## 7. Verify Deployment

### Check Application Status

```bash
# Check if service is running (adjust based on your setup)
systemctl status e-com
# Or check Docker containers if using Docker
docker ps
```

### Check Application Logs

```bash
# Application logs
tail -f /var/www/e-com/logs/app.log

# Or Docker logs
docker logs e-com
```

### Test Application

```bash
# Test if application is responding
curl http://localhost:3012
```

## Additional Setup (Recommended)

### Install Docker (if using --docker flag)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker service
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
```

### Setup PM2 (Alternative to Docker for Node.js apps)

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
cd /var/www/e-com
pm2 start dist/main.js --name e-com
pm2 save
pm2 startup
```

### Configure Firewall

```bash
# Allow SSH
ufw allow 22/tcp

# Allow application port
ufw allow 3012/tcp

# Enable firewall
ufw enable
ufw status
```

## Troubleshooting

### SSH Connection Issues

- Verify IP address and port are correct
- Check if firewall blocks SSH port
- Ensure SSH service is running on server

### SSH Key Generation Fails

**Error: "No such file or directory" when running `cat ~/.ssh/id_ed25519.pub`**

This happens when you typed a command (like `cat ~/.ssh/id_ed25519.pub`) instead of pressing Enter when prompted for the file location during key generation.

**Solution:**
1. Run the SSH key generation command again:
   ```bash
   ssh-keygen -t ed25519 -C "oday.qr.2001@gmail.com"
   ```
2. When you see: `Enter file in which to save the key (/root/.ssh/id_ed25519):`
   - **Simply press Enter** (do NOT type anything)
3. When prompted for passphrase, press Enter twice (for no passphrase)
4. Now you can run `cat ~/.ssh/id_ed25519.pub` to display your public key

**Common mistake:** Typing commands at prompts instead of just pressing Enter.

### Git Clone Fails

- Verify SSH key is added to GitHub (see "Add SSH Key to GitHub" section)
- Test SSH connection to GitHub: `ssh -T git@github.com`
  - Should see: "Hi [username]! You've successfully authenticated..."
- Check repository permissions (make sure you have access to the repository)
- Verify the repository SSH URL is correct: `git@github.com:obada404/e-com.git`
- If SSH key generation failed, see "SSH Key Generation Fails" section above

### Deployment Script Errors

- Verify Node.js is installed and in PATH
- Check script has execute permissions: `chmod +x deploy-nest.js`
- Review script logs for specific error messages

### Permission Issues

- Ensure running with `sudo` when needed
- Check directory permissions: `ls -la /var/www/`
- Verify user has access to required directories

## Quick Reference

### Login Command
```bash
ssh root@159.198.36.64
```

### Deployment Commands

**Using Docker (Recommended):**
```bash
cd /var/www/e-com
docker-compose up -d --build
```

**Manual Deployment:**
```bash
cd /var/www/e-com
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm install -g pm2
pm2 start dist/main.js --name e-com
```

### Important Directories
- `/var/www/` - Web root directory
- `/root/.ssh/` - SSH keys location (contains your SSH key pair)
- `/var/www/e-com/` - Application directory (after deployment)

### Your GitHub Repository
- **SSH URL:** `git@github.com:obada404/e-com.git`
- **HTTPS URL:** `https://github.com/obada404/e-com.git`
- **Repository Link:** [https://github.com/obada404/e-com](https://github.com/obada404/e-com)
- **Branch:** `main`

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Default Password:** After initial setup, change the root password
2. **Disable Root SSH:** Consider creating a sudo user and disabling root SSH login
3. **Use SSH Keys Only:** Disable password authentication and use only SSH keys
4. **Keep System Updated:** Regularly run `apt update && apt upgrade`
5. **Configure Firewall:** Only open necessary ports
6. **Monitor Logs:** Regularly check system and application logs

---

**Last Updated:** January 2025
