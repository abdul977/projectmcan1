import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { User, Mail, Lock, Phone, MapPin, Calendar, UserPlus, Building, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  address: z.string().min(5, 'Address is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  callUpNumber: z.string().min(5, 'Call-Up Number is required'),
  stateOfOrigin: z.string().min(2, 'State of Origin is required'),
  lga: z.string().min(2, 'Local Government Area is required'),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string().min(1, 'Date of Birth is required'),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  mcanRegNo: z.string().min(1, 'MCAN Registration Number is required'),
  institution: z.string().min(2, 'Institution is required'),
  // Emergency Contact
  emergencyContactName: z.string().min(2, 'Emergency Contact Name is required'),
  emergencyContactAddress: z.string().min(5, 'Emergency Contact Address is required'),
  emergencyContactPhone1: z.string().min(10, 'Emergency Contact Phone 1 is required'),
  emergencyContactPhone2: z.string().optional(),
  // Next of Kin
  nextOfKinName: z.string().min(2, 'Next of Kin Name is required'),
  nextOfKinAddress: z.string().min(5, 'Next of Kin Address is required'),
  nextOfKinPhone1: z.string().min(10, 'Next of Kin Phone 1 is required'),
  nextOfKinPhone2: z.string().optional(),
  // Additional fields
  islamicKnowledgeLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  dietaryPreferences: z.enum(['halal', 'vegetarian', 'none']),
  prayerRequirements: z.string().min(1, 'Please specify your prayer requirements'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('Authentication signup error:', {
          message: authError.message,
          status: authError.status,
          code: authError.code,
        });
        throw authError;
      }

      if (authData.user) {
        const profilePayload = {
          id: authData.user.id,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          call_up_number: data.callUpNumber,
          state_of_origin: data.stateOfOrigin,
          lga: data.lga,
          gender: data.gender,
          date_of_birth: data.dateOfBirth,
          marital_status: data.maritalStatus,
          mcan_reg_no: data.mcanRegNo,
          institution: data.institution,
          emergency_contact_name: data.emergencyContactName,
          emergency_contact_address: data.emergencyContactAddress,
          emergency_contact_phone1: data.emergencyContactPhone1,
          emergency_contact_phone2: data.emergencyContactPhone2 || null,
          next_of_kin_name: data.nextOfKinName,
          next_of_kin_address: data.nextOfKinAddress,
          next_of_kin_phone1: data.nextOfKinPhone1,
          next_of_kin_phone2: data.nextOfKinPhone2 || null,
          islamic_knowledge_level: data.islamicKnowledgeLevel,
          dietary_preferences: data.dietaryPreferences,
          prayer_requirements: data.prayerRequirements,
        };

        console.log('Profile payload:', profilePayload);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert(profilePayload)
          .select();

        if (profileError) {
          console.error('Profile insertion detailed error:', {
            message: profileError.message,
            details: profileError.details,
            code: profileError.code,
            hint: profileError.hint,
          });
          throw profileError;
        }

        console.log('Profile inserted successfully:', profileData);
      }

      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: any) {
      console.error('Full registration error:', error);
      toast.error(`Registration failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            MCAN FCT CHAPTER - Accommodation Form
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-green-600 hover:text-green-500">
              Sign in
            </a>
          </p>
          <p className="mt-2 text-sm text-gray-500 italic">
            "Say verily, my prayer, my sacrifice, my living, and my dying are for Allah, the lord of the worlds" (Q16:162)
          </p>
        </div>

        <form className="bg-white shadow rounded-lg p-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('fullName')}
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('password')}
                      type="password"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('address')}
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="callUpNumber" className="block text-sm font-medium text-gray-700">
                    Call-Up Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('callUpNumber')}
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  {errors.callUpNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.callUpNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="stateOfOrigin" className="block text-sm font-medium text-gray-700">
                    State of Origin
                  </label>
                  <input
                    {...register('stateOfOrigin')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {errors.stateOfOrigin && (
                    <p className="mt-1 text-sm text-red-600">{errors.stateOfOrigin.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lga" className="block text-sm font-medium text-gray-700">
                    Local Government Area
                  </label>
                  <input
                    {...register('lga')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {errors.lga && (
                    <p className="mt-1 text-sm text-red-600">{errors.lga.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    {...register('gender')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('dateOfBirth')}
                      type="date"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
                    Marital Status
                  </label>
                  <select
                    {...register('maritalStatus')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                  {errors.maritalStatus && (
                    <p className="mt-1 text-sm text-red-600">{errors.maritalStatus.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="mcanRegNo" className="block text-sm font-medium text-gray-700">
                    MCAN Reg. No.
                  </label>
                  <input
                    {...register('mcanRegNo')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {errors.mcanRegNo && (
                    <p className="mt-1 text-sm text-red-600">{errors.mcanRegNo.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                    Institution
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('institution')}
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  {errors.institution && (
                    <p className="mt-1 text-sm text-red-600">{errors.institution.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    {...register('emergencyContactName')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {errors.emergencyContactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="emergencyContactAddress" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    {...register('emergencyContactAddress')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {errors.emergencyContactAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactAddress.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="emergencyContactPhone1" className="block text-sm font-medium text-gray-700">
                    Phone Number 1
                  </label>
                  <input
                    {...register('emergencyContactPhone1')}
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {errors.emergencyContactPhone1 && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone1.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="emergencyContactPhone2" className="block text-sm font-medium text-gray-700">
                    Phone Number 2 (Optional)
                  </label>
                  <input
                    {...register('emergencyContactPhone2')}
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Next of Kin */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Next of Kin Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nextOfKinName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    {...register('nextOfKinName')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {errors.nextOfKinName && (
                    <p className="mt-1 text-sm text-red-600">{errors.nextOfKinName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nextOfKinAddress" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    {...register('nextOfKinAddress')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {errors.nextOfKinAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.nextOfKinAddress.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nextOfKinPhone1" className="block text-sm font-medium text-gray-700">
                    Phone Number 1
                  </label>
                  <input
                    {...register('nextOfKinPhone1')}
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                  {errors.nextOfKinPhone1 && (
                    <p className="mt-1 text-sm text-red-600">{errors.nextOfKinPhone1.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nextOfKinPhone2" className="block text-sm font-medium text-gray-700">
                    Phone Number 2 (Optional)
                  </label>
                  <input
                    {...register('nextOfKinPhone2')}
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="islamicKnowledgeLevel" className="block text-sm font-medium text-gray-700">
                    Islamic Knowledge Level
                  </label>
                  <select
                    {...register('islamicKnowledgeLevel')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dietaryPreferences" className="block text-sm font-medium text-gray-700">
                    Dietary Preferences
                  </label>
                  <select
                    {...register('dietaryPreferences')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="halal">Halal</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="none">No Specific Requirements</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="prayerRequirements" className="block text-sm font-medium text-gray-700">
                    Prayer Requirements
                  </label>
                  <textarea
                    {...register('prayerRequirements')}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Please specify any prayer-related requirements or accommodations needed"
                  />
                  {errors.prayerRequirements && (
                    <p className="mt-1 text-sm text-red-600">{errors.prayerRequirements.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}