/**
 * Waiver Form Component for CourtMaster Tournament Management System
 * 
 * Displays a digital waiver form for participants to review and sign.
 * Supports signature capture, mandatory fields, and data collection.
 */

import React, { useState, useRef } from 'react';
import { PenLine, FileText, Shield, AlertCircle, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useToast } from '../../hooks/useToast';
import { useUser } from '../../contexts/auth/useAuth';
import SignatureCanvas from 'react-signature-canvas';

interface WaiverFormProps {
  tournamentId: string;
  tournamentName: string;
  waiverId?: string;
  waiverContent: string;
  waiverTitle: string;
  onWaiverSigned?: (signatureData: string, formData: WaiverFormData) => Promise<boolean>;
  onCancel?: () => void;
  registrationId?: string;
}

export interface WaiverFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  acknowledgements: {
    readAndUnderstood: boolean;
    assumeRisks: boolean;
    releaseOfLiability: boolean;
    medicalConsent: boolean;
  }
}

export const WaiverForm: React.FC<WaiverFormProps> = ({
  tournamentId,
  tournamentName,
  waiverId,
  waiverContent,
  waiverTitle,
  onWaiverSigned,
  onCancel,
  registrationId
}) => {
  const { toast } = useToast();
  const { user } = useUser();
  const signaturePadRef = useRef<SignatureCanvas>(null);

  const [formData, setFormData] = useState<WaiverFormData>({
    fullName: user?.name || '',
    email: user?.email || '',
    phoneNumber: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    acknowledgements: {
      readAndUnderstood: false,
      assumeRisks: false,
      releaseOfLiability: false,
      medicalConsent: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAcknowledgementChange = (key: keyof WaiverFormData['acknowledgements'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      acknowledgements: { ...prev.acknowledgements, [key]: checked }
    }));

    // Clear error for this field if it exists
    if (errors[`acknowledgements.${key}`]) {
      setErrors(prev => ({ ...prev, [`acknowledgements.${key}`]: '' }));
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }

    // Clear error for signature if it exists
    if (errors.signature) {
      setErrors(prev => ({ ...prev, signature: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required';
    }

    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    }

    // Validate acknowledgements
    Object.entries(formData.acknowledgements).forEach(([key, value]) => {
      if (!value) {
        newErrors[`acknowledgements.${key}`] = 'This acknowledgement is required';
      }
    });

    // Validate signature
    if (signaturePadRef.current?.isEmpty()) {
      newErrors.signature = 'Signature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Get signature data URL
      const signatureDataURL = signaturePadRef.current?.toDataURL('image/png');

      if (!signatureDataURL) {
        throw new Error('Failed to capture signature');
      }

      // If a callback is provided, call it with the form data and signature
      if (onWaiverSigned) {
        const success = await onWaiverSigned(signatureDataURL, formData);

        if (success) {
          setShowSuccessMessage(true);
          
          toast({
            title: 'Waiver Signed',
            description: 'Your waiver has been successfully submitted.',
          });
        } else {
          throw new Error('Failed to submit waiver');
        }
      }
    } catch (error) {
      console.error('Error submitting waiver:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to submit waiver. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If waiver has been successfully signed, show success message
  if (showSuccessMessage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-green-600">Waiver Submitted</CardTitle>
          <CardDescription className="text-center">
            Thank you for completing the waiver for {tournamentName}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="bg-green-100 rounded-full p-4 mb-4">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <p className="text-center mb-4">
            Your waiver has been successfully submitted and recorded. You are now ready to participate in the tournament.
          </p>
          <Button onClick={onCancel} className="mt-4">
            Return to Registration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          {waiverTitle || 'Tournament Waiver'}
        </CardTitle>
        <CardDescription>
          Please read the waiver carefully and complete all required fields
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Waiver content */}
        <div>
          <h3 className="text-lg font-medium flex items-center mb-2">
            <FileText className="h-5 w-5 mr-2" />
            Waiver Terms
          </h3>
          <div className="border rounded-md p-4 bg-muted/30 h-64 overflow-y-auto">
            <div className="prose prose-sm">
              {waiverContent ? (
                <div dangerouslySetInnerHTML={{ __html: waiverContent }} />
              ) : (
                <p className="text-muted-foreground">
                  Standard waiver text including assumption of risk, release of liability, and medical consent for participation in {tournamentName}.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-medium mb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && (
                <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phoneNumber">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={errors.phoneNumber ? 'border-destructive' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-destructive text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className={errors.dateOfBirth ? 'border-destructive' : ''}
              />
              {errors.dateOfBirth && (
                <p className="text-destructive text-sm mt-1">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergencyContactName">
                Emergency Contact Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emergencyContactName"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleInputChange}
                className={errors.emergencyContactName ? 'border-destructive' : ''}
              />
              {errors.emergencyContactName && (
                <p className="text-destructive text-sm mt-1">{errors.emergencyContactName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergencyContactPhone">
                Emergency Contact Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={handleInputChange}
                className={errors.emergencyContactPhone ? 'border-destructive' : ''}
              />
              {errors.emergencyContactPhone && (
                <p className="text-destructive text-sm mt-1">{errors.emergencyContactPhone}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Acknowledgements */}
        <div>
          <h3 className="text-lg font-medium mb-2">Acknowledgements</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="readAndUnderstood"
                checked={formData.acknowledgements.readAndUnderstood}
                onCheckedChange={(checked) => 
                  handleAcknowledgementChange('readAndUnderstood', checked as boolean)
                }
                className={errors['acknowledgements.readAndUnderstood'] ? 'border-destructive' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="readAndUnderstood"
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    errors['acknowledgements.readAndUnderstood'] ? 'text-destructive' : ''
                  }`}
                >
                  I have read and understand the above waiver and release of liability.
                </Label>
                {errors['acknowledgements.readAndUnderstood'] && (
                  <p className="text-destructive text-xs">{errors['acknowledgements.readAndUnderstood']}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="assumeRisks"
                checked={formData.acknowledgements.assumeRisks}
                onCheckedChange={(checked) => 
                  handleAcknowledgementChange('assumeRisks', checked as boolean)
                }
                className={errors['acknowledgements.assumeRisks'] ? 'border-destructive' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="assumeRisks"
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    errors['acknowledgements.assumeRisks'] ? 'text-destructive' : ''
                  }`}
                >
                  I acknowledge and fully assume the risks associated with participation.
                </Label>
                {errors['acknowledgements.assumeRisks'] && (
                  <p className="text-destructive text-xs">{errors['acknowledgements.assumeRisks']}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="releaseOfLiability"
                checked={formData.acknowledgements.releaseOfLiability}
                onCheckedChange={(checked) => 
                  handleAcknowledgementChange('releaseOfLiability', checked as boolean)
                }
                className={errors['acknowledgements.releaseOfLiability'] ? 'border-destructive' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="releaseOfLiability"
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    errors['acknowledgements.releaseOfLiability'] ? 'text-destructive' : ''
                  }`}
                >
                  I release the tournament organizers from liability for injuries sustained during participation.
                </Label>
                {errors['acknowledgements.releaseOfLiability'] && (
                  <p className="text-destructive text-xs">{errors['acknowledgements.releaseOfLiability']}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="medicalConsent"
                checked={formData.acknowledgements.medicalConsent}
                onCheckedChange={(checked) => 
                  handleAcknowledgementChange('medicalConsent', checked as boolean)
                }
                className={errors['acknowledgements.medicalConsent'] ? 'border-destructive' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="medicalConsent"
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    errors['acknowledgements.medicalConsent'] ? 'text-destructive' : ''
                  }`}
                >
                  I consent to emergency medical treatment if needed during participation.
                </Label>
                {errors['acknowledgements.medicalConsent'] && (
                  <p className="text-destructive text-xs">{errors['acknowledgements.medicalConsent']}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Signature */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium flex items-center">
              <PenLine className="h-5 w-5 mr-2" />
              Digital Signature <span className="text-destructive">*</span>
            </h3>
            <Button variant="outline" size="sm" type="button" onClick={clearSignature}>
              Clear
            </Button>
          </div>
          <div className={`border rounded-md bg-background ${errors.signature ? 'border-destructive' : ''}`}>
            <SignatureCanvas
              ref={signaturePadRef}
              penColor="black"
              canvasProps={{
                className: 'signature-canvas',
                style: { width: '100%', height: '200px' }
              }}
            />
          </div>
          {errors.signature && (
            <p className="text-destructive text-sm mt-1">{errors.signature}</p>
          )}
        </div>

        {/* Privacy notice */}
        <Alert variant="outline">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Privacy Notice</AlertTitle>
          <AlertDescription>
            The information you provide will be used only for tournament registration and
            emergency purposes. It will not be shared with third parties except as required by law.
          </AlertDescription>
        </Alert>
      </CardContent>

      <CardFooter className="flex justify-between flex-wrap gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></div>
              Submitting...
            </>
          ) : (
            'Submit Waiver'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WaiverForm;
