#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const gitRepo = args[0];
const projectName = args[1];
const port = args[2] || '3000';
const branch = args.find(arg => arg.startsWith('--branch'))?.split('=')[1] || 'main';
const email = args.find(arg => arg.startsWith('--email'))?.split('=')[1] || 'admin@example.com';
const useSeed = args.includes('--seed');
const useDocker = args.includes('--docker');

if (!gitRepo || !projectName) {
    console.error('Usage: node deploy-nest.js <git-repo> <project-name> <port> [--branch=<branch>] [--email=<email>] [--seed] [--docker]');
    process.exit(1);
}

const projectPath = `/var/www/${projectName}`;
const log = (message) => console.log(`[DEPLOY] ${message}`);

try {
    log(`Starting deployment for ${projectName}...`);
    log(`Repository: ${gitRepo}`);
    log(`Branch: ${branch}`);
    log(`Port: ${port}`);
    log(`Email: ${email}`);
    log(`Seed: ${useSeed ? 'Yes' : 'No'}`);
    log(`Docker: ${useDocker ? 'Yes' : 'No'}`);

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

    if (useDocker) {
        log('Using Docker deployment...');

        // Check if Docker is installed
        try {
            execSync('docker --version', { stdio: 'ignore' });
        } catch (e) {
            log('Docker is not installed. Installing Docker...');
            execSync('curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sh /tmp/get-docker.sh', { stdio: 'inherit' });
            execSync('systemctl start docker && systemctl enable docker', { stdio: 'inherit' });
        }

        // Check if Docker Compose is available
        let dockerComposeCmd = 'docker-compose';
        try {
            execSync('docker-compose --version', { stdio: 'ignore' });
        } catch (e) {
            try {
                execSync('docker compose version', { stdio: 'ignore' });
                dockerComposeCmd = 'docker compose';
            } catch (e2) {
                log('Installing Docker Compose...');
                execSync('apt update && apt install -y docker-compose', { stdio: 'inherit' });
            }
        }

        // Update docker-compose.yml port if different from 3000
        if (port !== '3000') {
            const composeFile = path.join(projectPath, 'docker-compose.yml');
            if (fs.existsSync(composeFile)) {
                log(`Updating port in docker-compose.yml to ${port}...`);
                let composeContent = fs.readFileSync(composeFile, 'utf8');
                composeContent = composeContent.replace(/("3000:3000")/g, `"${port}:3000"`);
                fs.writeFileSync(composeFile, composeContent);
            }
        }

        // Stop existing containers
        log('Stopping existing containers...');
        try {
            execSync(`cd ${projectPath} && ${dockerComposeCmd} down`, { stdio: 'inherit' });
        } catch (e) {
            // Ignore if containers don't exist
        }

        // Build and start containers
        log('Building and starting Docker containers...');
        execSync(`cd ${projectPath} && ${dockerComposeCmd} up -d --build`, { stdio: 'inherit' });

        // Run seed if requested
        if (useSeed) {
            log('Running database seed...');
            try {
                execSync(`docker exec ecommerce-api npx tsx prisma/seed.ts`, { stdio: 'inherit' });
            } catch (e) {
                log('Warning: Seed failed. You can run it manually later.');
                log('Manual seed command: docker exec ecommerce-api npx tsx prisma/seed.ts');
            }
        }

        log('Deployment complete!');
        log(`Application should be available at: http://localhost:${port}`);
        log('Check logs with: docker logs ecommerce-api');
        log('Check status with: docker ps');

    } else {
        log('Using manual deployment (non-Docker)...');

        // Install dependencies
        log('Installing dependencies...');
        execSync(`cd ${projectPath} && npm install`, { stdio: 'inherit' });

        // Generate Prisma client
        log('Generating Prisma client...');
        execSync(`cd ${projectPath} && npx prisma generate`, { stdio: 'inherit' });

        // Run migrations
        log('Running database migrations...');
        execSync(`cd ${projectPath} && npx prisma migrate deploy`, { stdio: 'inherit' });

        // Run seed if requested
        if (useSeed) {
            log('Running database seed...');
            execSync(`cd ${projectPath} && npm run prisma:seed`, { stdio: 'inherit' });
        }

        // Build application
        log('Building application...');
        execSync(`cd ${projectPath} && npm run build`, { stdio: 'inherit' });

        log('Deployment complete!');
        log(`Build completed. Start the application with: cd ${projectPath} && npm run start:prod`);
        log('Or use PM2: pm2 start dist/main.js --name ' + projectName);
    }

} catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
}
