![aws](https://sdk-for-net.amazonwebservices.com/images/AWSLogo128x128.png)	

# ⚙️ Evee API v1

**Overview**
-

API currently supports `/events/create` resource for allowing event aggregator services to send new event data to Evee.
As of now the service is validating the events and sending them into AWS SQS (Simple Queue Services).

**Technical Details**
-

- Service is built using Node.js with Express
- Service is currently hosted on AWS EC2 (Ubuntu 18.04 AMI)
- Service is daemonized on EC2 Instance using PM2 
    - (`sudo pm2 ls` to view status of service process)
    - (`sudo pm2 monit` to view live logs via CLI)