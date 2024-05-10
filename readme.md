# CSV to JSON Converter API with PostgreSQL Integration

This Node.js application provides an API for converting CSV files to JSON format and uploading the data into a PostgreSQL database. It also includes functionality to calculate the age distribution of users in the database and print a report.

### Assumptions:

- *.csv* file will not be an empty file
- No header will be an empty string or a duplicate value
- The mandatory field headers will be same case as mentioned in problem statement
- Headers and fields will not contain special characters like comma or single/double quotes
- *name.firstName*, *name.lastName*, *age* will always be available
- The age field will always be an integer value
- Fields that do not have a value defined, need not be stored in additional_fields

## Prerequisites:

- Node.js is installed
- PostgreSQL is configured

## Setup

1. **Install dependencies**:

   ```npm install```
2. **Set environment variables**:

   ```makefile
   PORT=3000
   DB_USER=your_username
   DB_HOST=your_database_host
   DB_NAME=your_database_name
   DB_PASSWORD=your_database_password
   DB_PORT=your_database_port
   CSV_FILE_PATH='./sample_csv/filename.csv'
   ```

## Start Application
**To start the application, run**:

   ```bash
   npm run test
   ```

## Access the API
The following endpoints are available:

- `POST /upload`: Upload a CSV file to convert and insert data into the database.

Example of using cURL to upload a CSV file:

   ```bash
   curl -X POST http://localhost:3000/upload
   ```
edit port number accordingly

## Packages Used
- csv-parser
- dotenv
- express
- nodemon
- pg
