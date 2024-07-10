# Domain Information System

This system allows users to add a domain and retrieve information about it using VirusTotal and WHOIS APIs. The system leverages RabbitMQ for task queuing and PostgreSQL for data storage. The scanning process runs at a fixed interval defined by the `SCAN_INTERVAL` variable in the `.env` file, with a default setting of once a month.

## Getting Started

### Prerequisites

Ensure you have Docker and Docker Compose installed on your machine.

### Installation

1. **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2. **Environment Configuration:**
    - Copy the example environment file and adjust the configurations as needed.
        ```bash
        cp .env.example .env
        ```
    - Update the secret keys and any other variables in the `.env` file.

3. **Build and Run the Docker Containers:**
    ```bash
    docker-compose build
    docker-compose up
    ```

### Usage

#### POST - Add a Domain

To add a domain to the scanner queue, make a POST request:

```bash
Method: POST 

Url: http://localhost:3000/api/add-domain

Headers:
    {Content-Type: application/json}

Body:
    {"url": "<domainName>"}
```
-  #### Response:
    
    **Success**: Domain is added successfully to the scanner queue.

    **Invalid**: The domain is invalid.

    **Exists**: The domain already exists.


#### GET - Get Domain Information
To retrieve information about a domain, make a GET request:

```bash
Method: GET 

Url: http://localhost:3000/api/add-domain

Params:
    url=<domainName>
```
-  #### Response:
    
    **Success**: Returns the domain information.

    **Pending**: The domain is pending in the queue.

    **Invalid**: The domain is invalid.
    
    **Not exists**: The domain isn't exists.



## System Overview

- **RabbitMQ:** Used for task queuing. When a domain is added, it is sent to RabbitMQ, and the worker processes it when ready.
- **PostgreSQL:** All domain information is stored in a PostgreSQL database.
- **Scheduled Scanning:** The system runs the scanner using a cron job at intervals defined by the `SCAN_INTERVAL` variable in the `.env` file (default is once a month).

