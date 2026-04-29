# Human Resource Management System

This is a backend application for the Human Resource Management System, built using Node.js and MySQL. The application allows employees to manage their leave requests efficiently.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Database Configuration](#database-configuration)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/human-resource-management-system-backend.git
   ```

2. Navigate to the project directory:
   ```
   cd human-resource-management-system-backend
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your database configuration:
   ```
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=esrdatabase
   JWT_SECRET=your_jwt_secret
   ```

## Usage

To start the application, run:
```
npm start
```

The server will start on `http://localhost:3000`.

## API Endpoints

- **Authentication**
  - `POST /api/auth/login` - Login an employee
  - `POST /api/auth/register` - Register a new employee

- **Leave Management**
  - `GET /api/leaves` - Retrieve all leave requests
  - `POST /api/leaves` - Create a new leave request
  - `PUT /api/leaves/:id` - Update a leave request
  - `DELETE /api/leaves/:id` - Delete a leave request

## Database Configuration

The application uses MySQL as the database. Ensure that your database is set up and the connection details are correctly specified in the `.env` file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.