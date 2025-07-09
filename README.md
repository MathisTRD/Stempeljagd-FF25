# Stempeljagd - Station Management System

A modern web application for managing groups and stations in youth work activities (Stempeljagd/Stamp Hunt).

## 🚀 Features

- **Real-time Station Management**: Track station occupancy and group progress
- **Group Management**: Automatically manage group assignments and station rotation
- **Statistics Dashboard**: View completion rates and group performance
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Firebase Integration**: Cloud-based data storage and real-time updates
- **Secure Configuration**: Environment-based credential management

## 📁 Project Structure

```
Jugendarbeit/
├── public/                 # Web application files
│   ├── index.html         # Main HTML file
│   ├── style.css          # Consolidated styles
│   └── js/
│       ├── script.js      # Main application logic
│       ├── firebase-config.js  # Firebase database operations
│       └── config.js      # Environment configuration loader
├── assets/
│   └── Logo.jpg          # Application logo
├── .env                  # Environment variables (local)
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
├── package.json         # Project configuration
├── vercel.json          # Vercel deployment config
└── README.md           # This file
```

## 🛠️ Setup & Installation

### Prerequisites
- Modern web browser
- Python 3.x (for local development server)
- Firebase project (for data storage)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Jugendarbeit
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Firebase configuration:
   ```
   FIREBASE_API_KEY=your_api_key_here
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   # or
   cd public && python3 -m http.server 8000
   ```

4. **Open Application**
   Visit `http://localhost:8000` in your browser

### Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a collection called `stations` with documents containing:
   - `Stationsname` (string): Name of the station
   - `Standort` (string): Location of the station
   - `Stationsnummer` (string): Station number/identifier

4. Set up Firestore security rules (for testing):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // For testing only!
       }
     }
   }
   ```

5. Copy the Firebase configuration to your `.env` file

### Deployment

#### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all the `FIREBASE_*` variables from your `.env` file
3. Deploy automatically on push to main branch

#### Static Hosting
The application can be deployed to any static hosting service:
- Copy the `public/` directory contents to your hosting provider
- Ensure environment variables are properly configured for your hosting platform

## 🎮 Usage

### Managing Groups
- Groups are automatically created based on station count
- Track group progress through different stations
- Mark stations as completed, failed, or skipped
- View real-time group status and next assigned stations

### Station Management
- Add, edit, and remove stations through Firebase console
- View station occupancy in real-time
- Sort and filter stations by various criteria
- Track which groups are currently at each station

### Statistics
- View completion rates by group
- Track overall progress across all groups
- Monitor group performance metrics
- Export data for further analysis

## 🔧 Configuration

### Environment Variables
All sensitive configuration is managed through environment variables:
- `FIREBASE_API_KEY`: Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Firebase authentication domain
- `FIREBASE_PROJECT_ID`: Firebase project identifier
- `FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `FIREBASE_APP_ID`: Firebase application ID
- `FIREBASE_MEASUREMENT_ID`: Google Analytics measurement ID

### Deployment Configuration
- `vercel.json`: Vercel-specific settings with security headers
- `package.json`: Project metadata and scripts
- `.gitignore`: Files and directories to exclude from version control

## 🛡️ Security

- Firebase credentials are stored in environment variables
- No sensitive data committed to version control
- Security headers configured for production deployment
- Client-side error handling for failed requests
- Proper Firebase security rules should be implemented for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 👤 Author

**Mathis**
- Stempeljagd Management System for Youth Work Activities

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with optimized structure
- Consolidated file organization
- Environment-based configuration
- Improved security practices
- Responsive design enhancements
- Comprehensive error handling

## 🆘 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify your `.env` file configuration
   - Check Firebase console for any quota limits
   - Ensure Firestore rules allow your operations

2. **Local Development Server Issues**
   - Make sure Python 3.x is installed
   - Try a different port if 8000 is busy: `python3 -m http.server 3000`
   - Check that you're running the server from the `public` directory

3. **Deployment Issues**
   - Verify all environment variables are set in your hosting platform
   - Check that the public directory is properly configured as the build output
   - Review browser console for any JavaScript errors

## 🔮 Future Enhancements

- [ ] Admin panel for station management
- [ ] Group customization options
- [ ] Export functionality for statistics
- [ ] Mobile app version
- [ ] Real-time notifications
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] QR code integration for stations

## 🎨 New Design Features

### Dark Mode Support
- **Automatic Detection**: Respects system dark/light mode preference
- **Manual Toggle**: Click the theme toggle in the header to switch modes
- **Persistent**: Your preference is saved and remembered across sessions
- **Smooth Transitions**: All elements animate smoothly between themes

### Enhanced Logo Integration
- **Header Positioning**: Logo is now properly integrated into the header design
- **Hover Effects**: Interactive hover animations for better user experience
- **Responsive Design**: Logo scales appropriately on different screen sizes
- **Modern Styling**: Rounded corners and subtle shadows for a polished look

### Visual Improvements
- **Modern Color Palette**: Updated color scheme with CSS custom properties
- **Enhanced Cards**: Group cards now have better shadows and hover effects
- **Improved Tables**: Better contrast and hover states for table rows
- **Status Indicators**: Color-coded status badges with background highlighting
- **Responsive Header**: Header layout adapts beautifully to mobile devices
