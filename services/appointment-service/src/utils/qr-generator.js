/**
 * QR Code Generator with HMAC Security
 * 
 * Purpose: Generate secure QR codes for appointment check-in
 * Security: HMAC signature prevents tampering
 * 
 * QR Code Contains:
 * - appointmentId
 * - customerId
 * - date
 * - timestamp
 * - HMAC signature
 * 
 * Benefits:
 * - Cannot be forged (HMAC validation)
 * - Time-limited (expires after appointment date)
 * - One-time use (marked after scan)
 * - Offline verification possible (signature check)
 * 
 * Academic Value:
 * - Demonstrates secure token generation
 * - Shows HMAC usage for data integrity
 * - Prevents common QR code attacks
 */

const crypto = require('crypto');
const QRCode = require('qrcode');

class QRCodeGenerator {
  constructor() {
    this.secret = process.env.QR_CODE_SECRET || 'your-qr-secret-key-change-in-production';
    this.algorithm = 'sha256';
  }

  /**
   * Generate QR code for appointment
   * 
   * @param {object} appointment - Appointment details
   * @returns {Promise<string>} - Base64 encoded QR code image
   */
  async generateAppointmentQR(appointment) {
    const {
      id: appointmentId,
      customerId,
      date,
      time,
    } = appointment;

    // Create payload
    const payload = {
      appointmentId,
      customerId,
      date,
      time,
      timestamp: Date.now(),
      version: '1.0',
    };

    // Generate HMAC signature
    const signature = this.generateSignature(payload);

    // Add signature to payload
    const signedPayload = {
      ...payload,
      signature,
    };

    // Convert to JSON string
    const data = JSON.stringify(signedPayload);

    // Generate QR code as base64 image
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    console.log(`✅ QR code generated for appointment ${appointmentId}`);

    return qrCodeDataUrl;
  }

  /**
   * Generate HMAC signature for payload
   */
  generateSignature(payload) {
    // Create canonical string (deterministic order)
    const canonicalString = [
      payload.appointmentId,
      payload.customerId,
      payload.date,
      payload.time,
      payload.timestamp,
      payload.version,
    ].join('|');

    // Generate HMAC
    const hmac = crypto.createHmac(this.algorithm, this.secret);
    hmac.update(canonicalString);
    
    return hmac.digest('hex');
  }

  /**
   * Verify QR code signature
   * 
   * @param {object} payload - Decoded QR payload
   * @returns {object} - Verification result
   */
  verifyQRCode(payload) {
    try {
      const { signature, ...data } = payload;

      if (!signature) {
        return {
          valid: false,
          error: 'MISSING_SIGNATURE',
          message: 'QR code is missing signature',
        };
      }

      // Regenerate signature from data
      const expectedSignature = this.generateSignature(data);

      // Compare signatures (timing-safe)
      if (!crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )) {
        return {
          valid: false,
          error: 'INVALID_SIGNATURE',
          message: 'QR code signature is invalid (possibly tampered)',
        };
      }

      // Check if QR code is expired (24 hours after appointment)
      const appointmentDate = new Date(data.date);
      const expiryDate = new Date(appointmentDate);
      expiryDate.setHours(expiryDate.getHours() + 24);

      if (new Date() > expiryDate) {
        return {
          valid: false,
          error: 'EXPIRED',
          message: 'QR code has expired',
        };
      }

      // Check if appointment is in the future (can't check in too early)
      const appointmentDateTime = new Date(data.date);
      const [hours, minutes] = data.time.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const now = new Date();
      const earlyCheckInWindow = new Date(appointmentDateTime);
      earlyCheckInWindow.setMinutes(earlyCheckInWindow.getMinutes() - 30); // 30 min early

      if (now < earlyCheckInWindow) {
        return {
          valid: false,
          error: 'TOO_EARLY',
          message: 'Cannot check in more than 30 minutes early',
        };
      }

      // QR code is valid
      return {
        valid: true,
        data: {
          appointmentId: data.appointmentId,
          customerId: data.customerId,
          date: data.date,
          time: data.time,
        },
      };
    } catch (error) {
      console.error('❌ QR verification error:', error);
      return {
        valid: false,
        error: 'VERIFICATION_ERROR',
        message: 'Failed to verify QR code',
      };
    }
  }

  /**
   * Decode QR code from scanned data
   * 
   * @param {string} scannedData - Raw QR code data
   * @returns {object} - Parsed payload
   */
  decodeQRCode(scannedData) {
    try {
      return JSON.parse(scannedData);
    } catch (error) {
      throw new Error('Invalid QR code format');
    }
  }

  /**
   * Generate QR code for URL
   */
  async generateURLQR(url) {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return qrCodeDataUrl;
  }

  /**
   * Generate QR code as SVG
   */
  async generateQRCodeSVG(data) {
    const qrCodeSVG = await QRCode.toString(data, {
      type: 'svg',
      errorCorrectionLevel: 'M',
    });

    return qrCodeSVG;
  }
}

// Singleton instance
const qrGenerator = new QRCodeGenerator();

module.exports = qrGenerator;

/**
 * USAGE EXAMPLE:
 * 
 * === Generate QR on Appointment Creation ===
 * const qrGenerator = require('./utils/qr-generator');
 * 
 * async function createAppointment(req, res) {
 *   const appointment = await Appointment.create(req.body);
 *   
 *   // Generate QR code
 *   const qrCode = await qrGenerator.generateAppointmentQR(appointment);
 *   
 *   // Store QR code in database
 *   appointment.qrCode = qrCode;
 *   await appointment.save();
 *   
 *   // Publish Kafka event (includes QR code)
 *   await kafka.publish('appointments-topic', {
 *     eventType: 'appointment.created',
 *     data: {
 *       ...appointment,
 *       qrCode,
 *     },
 *   });
 *   
 *   // Notification service will email QR to customer
 *   
 *   res.json({ success: true, data: appointment });
 * }
 * 
 * === Verify QR at Check-In ===
 * async function checkInWithQR(req, res) {
 *   const { qrData } = req.body;
 *   
 *   // Decode QR code
 *   const payload = qrGenerator.decodeQRCode(qrData);
 *   
 *   // Verify signature
 *   const verification = qrGenerator.verifyQRCode(payload);
 *   
 *   if (!verification.valid) {
 *     return res.status(400).json({
 *       success: false,
 *       error: verification.error,
 *       message: verification.message,
 *     });
 *   }
 *   
 *   // Check if appointment exists
 *   const appointment = await Appointment.findById(verification.data.appointmentId);
 *   
 *   if (!appointment) {
 *     return res.status(404).json({
 *       success: false,
 *       error: 'Appointment not found',
 *     });
 *   }
 *   
 *   // Check if already checked in
 *   if (appointment.checkedInAt) {
 *     return res.status(400).json({
 *       success: false,
 *       error: 'Already checked in',
 *       message: 'This appointment has already been checked in',
 *     });
 *   }
 *   
 *   // Mark as checked in
 *   appointment.status = 'checked_in';
 *   appointment.checkedInAt = new Date();
 *   await appointment.save();
 *   
 *   // Publish Kafka event
 *   await kafka.publish('appointments-topic', {
 *     eventType: 'appointment.checkedin',
 *     data: {
 *       appointmentId: appointment.id,
 *       checkedInAt: appointment.checkedInAt,
 *     },
 *   });
 *   
 *   res.json({
 *     success: true,
 *     message: 'Successfully checked in',
 *     data: appointment,
 *   });
 * }
 * 
 * === Frontend QR Scanner ===
 * import { Html5QrcodeScanner } from 'html5-qrcode';
 * 
 * const scanner = new Html5QrcodeScanner("qr-reader", {
 *   fps: 10,
 *   qrbox: 250,
 * });
 * 
 * scanner.render(
 *   async (decodedText) => {
 *     // Send to backend for verification
 *     const response = await fetch('/api/appointments/checkin', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ qrData: decodedText }),
 *     });
 *     
 *     if (response.ok) {
 *       alert('Check-in successful!');
 *     } else {
 *       const error = await response.json();
 *       alert(error.message);
 *     }
 *   },
 *   (error) => {
 *     console.error('Scan error:', error);
 *   }
 * );
 * 
 * SECURITY BENEFITS:
 * 
 * 1. Tamper-Proof:
 *    - HMAC signature prevents modification
 *    - Changing any field invalidates signature
 *    - Cannot forge QR codes
 * 
 * 2. Time-Limited:
 *    - Expires 24h after appointment
 *    - Cannot check in too early (30min window)
 *    - Prevents replay attacks
 * 
 * 3. One-Time Use:
 *    - Database tracks if already checked in
 *    - Cannot reuse same QR code
 *    - Audit trail maintained
 * 
 * 4. Offline Verification:
 *    - Signature can be verified without database
 *    - Works even with network issues
 *    - Fast verification
 * 
 * ATTACK SCENARIOS PREVENTED:
 * 
 * Attack 1: Fake QR Code
 * - Attacker creates QR with fake appointmentId
 * - Signature verification fails (no secret key)
 * - Check-in rejected
 * 
 * Attack 2: Modified QR Code
 * - Attacker changes date in valid QR
 * - Signature becomes invalid
 * - Check-in rejected
 * 
 * Attack 3: Replay Attack
 * - Attacker reuses old QR code
 * - Database shows already checked in
 * - Check-in rejected
 * 
 * Attack 4: Early Check-In
 * - Customer tries to check in days early
 * - Time window check fails
 * - Check-in rejected
 * 
 * ACADEMIC SIGNIFICANCE:
 * - Demonstrates HMAC for data integrity
 * - Shows secure token generation
 * - Prevents common QR code vulnerabilities
 * - Production-ready security implementation
 */
