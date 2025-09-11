import QRCode from 'qrcode';

export const generateQRCodeURL = async (
  personId: string, 
  personType: 'student' | 'staff',
  personName: string,
  classOrDepartment: string
): Promise<string> => {
  try {
    // Generate QR code with URL that will auto-mark attendance
    const timestamp = new Date().toISOString();
    
    // Create URL with attendance parameters
    const baseUrl = window.location.origin;
    const attendanceUrl = `${baseUrl}/attendance-check?type=${personType}&id=${personId}&name=${encodeURIComponent(personName)}&class=${encodeURIComponent(classOrDepartment)}&timestamp=${encodeURIComponent(timestamp)}`;
    
    const qrCodeDataURL = await QRCode.toDataURL(attendanceUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code for person:', personId, personType, personName, error);
    return '';
  }
}