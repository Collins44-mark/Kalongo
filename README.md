# KALONGO FARM - Eco Farm Lodge Website

A modern, responsive website for KALONGO FARM - an ecosystem farm lodge offering unique accommodations and farm experiences.

## Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Logo and company name in header
- ✅ Three room types: A-Cabin, Cottage, Kikota
- ✅ Package offerings with pricing
- ✅ Facilities showcase (swimming pool, farm, animals, etc.)
- ✅ Booking form with WhatsApp integration
- ✅ Google Maps integration showing live location
- ✅ Modern, clean design with smooth animations

## Setup Instructions

### 1. Google Maps API Key

To enable the Google Maps functionality, you need to:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Maps JavaScript API"
4. Create an API key
5. Open `index.html` and replace `YOUR_API_KEY` on line 295 with your actual API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&callback=initMap" async defer></script>
```

### 2. Update Hotel Location Coordinates

In `js/script.js`, update the coordinates (line 12) with your actual location:

```javascript
const kalongoFarmLocation = { lat: YOUR_LATITUDE, lng: YOUR_LONGITUDE };
```

You can get coordinates from Google Maps by right-clicking on your location.

### 3. Replace Logo

Replace the placeholder logo in `index.html` (line 17). You can:
- Upload your logo image to an `images` folder
- Update the `src` attribute: `src="images/your-logo.png"`

Current placeholder: `https://via.placeholder.com/80x80/4CAF50/ffffff?text=KF`

### 4. Update Contact Information

Update the following in `index.html`:
- Address in the Location section (around line 257)
- Email and phone in Location section and Footer
- WhatsApp number field default (if desired)

### 5. Update Images (Optional)

The website uses Unsplash images. You can replace them with your own:
- Room images in the Rooms section
- Hero background image
- Any other images as needed

## File Structure

```
KALONGOWEB/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Stylesheet
├── js/
│   └── script.js      # JavaScript functionality
└── README.md          # This file
```

## How It Works

### Booking System
1. Visitors fill out the booking form
2. Form data is formatted into a WhatsApp message
3. WhatsApp opens with the pre-filled message
4. Visitor sends the message to the hotel's WhatsApp number

**Note:** Make sure to provide the correct WhatsApp number format (with country code, e.g., +1234567890)

### Google Maps
- Shows the hotel's location on an interactive map
- Automatically centers based on the provided coordinates
- Displays a marker with hotel information

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

All colors and styling can be customized in `css/style.css` using CSS variables at the top of the file:

```css
:root {
    --primary-color: #4CAF50;  /* Main brand color */
    --secondary-color: #8BC34A;
    --accent-color: #FF9800;
    /* ... more variables */
}
```

## Notes

- The website uses Google Fonts (Poppins) - requires internet connection
- Google Maps requires an active API key
- WhatsApp integration works on devices with WhatsApp installed
- All forms include basic validation

## Support

For questions or issues, refer to the code comments or customize as needed for your specific requirements.
