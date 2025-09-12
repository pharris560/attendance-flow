import QRCode from 'qrcode';

export const generateQRCodeURL = async (
  personId: string, 
  personType: 'student' | 'staff',
  personName: string,
  classOrDepartment: string
): Promise<string> => {
  try {
    // Get the base URL - use environment variable or current domain
    let baseUrl = '';
    
    if (typeof window !== 'undefined') {
      // Check if we have a production URL set
      const productionUrl = import.meta.env.VITE_APP_URL;
      
      if (productionUrl) {
        baseUrl = productionUrl;
      } else {
        // Fallback to current domain, but handle development environments
        const currentHost = window.location.host;
        
        if (currentHost.includes('webcontainer-api.io') || currentHost.includes('localhost') || currentHost.includes('bolt.new')) {
          // For development, use your production domain
          baseUrl = 'https://attendanceai.app';
        } else {
          baseUrl = `${window.location.protocol}//${window.location.host}`;
        }
      }
    }
    
    // Create URL with query parameters for attendance check - include both ID and name for fallback matching
    const attendanceUrl = `${baseUrl}/attendance-check?type=${encodeURIComponent(personType)}&id=${encodeURIComponent(personId)}&name=${encodeURIComponent(personName)}&class=${encodeURIComponent(classOrDepartment)}&timestamp=${encodeURIComponent(new Date().toISOString())}&app=ace-attendance`;
    
    console.log('Generated QR code URL:', attendanceUrl);
    
    const qrCodeDataURL = await QRCode.toDataURL(attendanceUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // Higher error correction for better mobile scanning
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code for person:', personId, personType, personName, error);
    return '';
  }
}