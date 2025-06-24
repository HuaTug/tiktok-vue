# TikTok User Management Frontend

A modern Vue 3 frontend application for TikTok user management system, built with Element Plus UI components.

## Features

- **User Authentication**
  - User registration with form validation
  - User login with email/username support
  - JWT token-based authentication
  - Auto-redirect based on authentication status

- **User Profile Management**
  - View user profile information
  - Update profile details (username, password)
  - Avatar upload functionality
  - Account deletion with confirmation

- **Dashboard**
  - User information overview
  - Quick access to profile settings
  - User statistics display
  - Responsive design

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vue Router 4** - Official router for Vue.js
- **Element Plus** - Vue 3 UI library
- **Axios** - HTTP client for API requests
- **Vite** - Fast build tool and development server

## Project Structure

```
vue-user-frontend/
├── src/
│   ├── api/
│   │   └── index.js          # API service layer
│   ├── components/
│   │   ├── Login.vue         # Login component
│   │   ├── Register.vue      # Registration component
│   │   ├── Dashboard.vue     # Dashboard component
│   │   └── Profile.vue       # Profile management component
│   ├── App.vue               # Root component
│   └── main.js               # Application entry point
├── index.html                # HTML template
├── vite.config.js            # Vite configuration
└── package.json              # Project dependencies
```

## API Integration

The frontend integrates with the following backend user APIs:

- `POST /user/create` - Create new user account
- `POST /user/login` - User authentication
- `GET /user/info/:id` - Get user information
- `PUT /user/update` - Update user profile
- `DELETE /user/delete/:id` - Delete user account
- `POST /user/send-code` - Send verification code
- `POST /user/verify-code` - Verify email code

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vue-user-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint**
   Update the backend API URL in `vite.config.js`:
   ```javascript
   proxy: {
     '/api': {
       target: 'http://your-backend-url:port',
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/api/, '')
     }
   }
   ```

## Development

1. **Start development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Preview production build**
   ```bash
   npm run preview
   ```

## Usage

### User Registration
1. Navigate to `/register`
2. Fill in username, email, password, and gender
3. Submit the form to create a new account
4. Redirect to login page upon successful registration

### User Login
1. Navigate to `/login`
2. Enter username/email and password
3. Submit to authenticate
4. Redirect to dashboard upon successful login

### Dashboard
- View user information overview
- Access quick actions
- Navigate to profile settings
- Logout functionality

### Profile Management
1. Navigate to `/profile` from dashboard
2. Update username and password
3. Upload new avatar image
4. Save changes or reset form
5. Delete account (with confirmation)

## Authentication Flow

- JWT tokens are stored in localStorage
- Automatic token inclusion in API requests
- Route guards protect authenticated pages
- Auto-redirect on token expiration
- Logout clears all stored data

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository or contact the development team.