#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const gitRepo = args[0];
const projectName = args[1];
const apiUrl = args.find(arg => arg.startsWith('--api-url'))?.split('=')[1] || 'http://localhost:3000';
const branch = args.find(arg => arg.startsWith('--branch'))?.split('=')[1] || 'main';
const useNginx = args.includes('--nginx');

if (!gitRepo || !projectName) {
  console.error('Usage: node deploy-frontend.js <git-repo> <project-name> [--api-url=<url>] [--branch=<branch>] [--nginx]');
  process.exit(1);
}

const projectPath = `/var/www/${projectName}`;
const log = (message) => console.log(`[DEPLOY] ${message}`);

try {
  log(`Starting frontend deployment for ${projectName}...`);
  log(`Repository: ${gitRepo}`);
  log(`Branch: ${branch}`);
  log(`API URL: ${apiUrl}`);
  log(`Nginx: ${useNginx ? 'Yes' : 'No'}`);

  // Ensure /var/www exists
  if (!fs.existsSync('/var/www')) {
    log('Creating /var/www directory...');
    execSync('mkdir -p /var/www', { stdio: 'inherit' });
  }

  // Clone or update repository
  if (fs.existsSync(projectPath)) {
    log(`Updating existing repository at ${projectPath}...`);
    execSync(`cd ${projectPath} && git fetch origin && git checkout ${branch} && git pull origin ${branch}`, { stdio: 'inherit' });
  } else {
    log(`Cloning repository to ${projectPath}...`);
    execSync(`git clone -b ${branch} ${gitRepo} ${projectPath}`, { stdio: 'inherit' });
  }

  // Create .env file
  log('Creating .env file...');
  const envContent = `VITE_API_BASE_URL=${apiUrl}\n`;
  fs.writeFileSync(path.join(projectPath, '.env'), envContent);
  log(`Created .env with VITE_API_BASE_URL=${apiUrl}`);

  // Install dependencies
  log('Installing dependencies...');
  execSync(`cd ${projectPath} && npm install`, { stdio: 'inherit' });

  // Build the frontend
  log('Building frontend...');
  execSync(`cd ${projectPath} && npm run build`, { stdio: 'inherit' });

  // Verify build
  const distPath = path.join(projectPath, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build failed - dist folder not found');
  }
  if (!fs.existsSync(path.join(distPath, 'index.html'))) {
    throw new Error('Build failed - index.html not found in dist folder');
  }
  log('Build completed successfully!');

  if (useNginx) {
    log('Configuring Nginx...');
    
    // Check if Nginx is installed
    try {
      execSync('nginx -v', { stdio: 'ignore' });
    } catch (e) {
      log('Nginx is not installed. Installing Nginx...');
      execSync('apt update && apt install -y nginx', { stdio: 'inherit' });
    }

    // Create Nginx configuration
    const nginxConfig = `server {
    listen 80;
    server_name _;

    root ${projectPath}/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`;

    const nginxConfigPath = `/etc/nginx/sites-available/${projectName}`;
    fs.writeFileSync(nginxConfigPath, nginxConfig);
    log(`Created Nginx config at ${nginxConfigPath}`);

    // Enable site
    const nginxEnabledPath = `/etc/nginx/sites-enabled/${projectName}`;
    if (fs.existsSync(nginxEnabledPath)) {
      execSync(`rm ${nginxEnabledPath}`, { stdio: 'inherit' });
    }
    execSync(`ln -s ${nginxConfigPath} ${nginxEnabledPath}`, { stdio: 'inherit' });
    log('Enabled Nginx site');

    // Remove default site if it exists
    const defaultSite = '/etc/nginx/sites-enabled/default';
    if (fs.existsSync(defaultSite)) {
      execSync(`rm ${defaultSite}`, { stdio: 'inherit' });
      log('Removed default Nginx site');
    }

    // Test and restart Nginx
    log('Testing Nginx configuration...');
    execSync('nginx -t', { stdio: 'inherit' });
    
    log('Restarting Nginx...');
    execSync('systemctl restart nginx', { stdio: 'inherit' });
    execSync('systemctl enable nginx', { stdio: 'inherit' });

    // Open firewall
    try {
      execSync('ufw allow 80/tcp', { stdio: 'inherit' });
      log('Opened port 80 in firewall');
    } catch (e) {
      log('Warning: Could not configure firewall (ufw may not be installed)');
    }

    log('Nginx configuration complete!');
    log(`Frontend should be available at: http://your-server-ip`);
  }

  log('Deployment complete!');
  log(`Frontend built at: ${distPath}`);
  if (useNginx) {
    log('Frontend is served via Nginx on port 80');
  } else {
    log('To serve the frontend, configure a web server to serve: ' + distPath);
  }

} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
