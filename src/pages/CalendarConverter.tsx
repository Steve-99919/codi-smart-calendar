
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Upload, FileCheck, AlertCircle, Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isWeekend, parseISO, parse } from 'date-fns';

// Google Calendar API credentials
const CLIENT_ID = '962924990476-900r62gdobeo6u9mmm94jegk55ob3csu.apps.googleusercontent.com';
const API_KEY = ''; // Public API key isn't needed for OAuth flow
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

interface CSVRow {
  activityId: string;
  activityName: string;
  description: string;
  strategy: string;
  prepDate: string;
  goDate: string;
  isValid: boolean;
  invalidReason?: string;
}

const CalendarConverter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [publicHolidays, setPublicHolidays] = useState<Date[]>([]);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check user session
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/login');
          return;
        }
        setUserEmail(data.session.user.email);
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  // Load Google API client
  useEffect(() => {
    const loadGapiClient = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', initClient);
      };
      document.body.appendChild(script);
    };

    const initClient = () => {
      window.gapi.client
        .init({
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        })
        .then(() => {
          setIsGapiLoaded(true);
          // Listen for sign-in state changes
          window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
          // Handle the initial sign-in state
          updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
        })
        .catch((error: any) => {
          console.error('Error initializing Google API client:', error);
        });
    };

    const updateSigninStatus = (isSignedIn: boolean) => {
      setIsAuthorized(isSignedIn);
    };

    loadGapiClient();

    // Cleanup
    return () => {
      const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (gapiScript) {
        gapiScript.remove();
      }
    };
  }, []);

  // Fetch Australian public holidays
  useEffect(() => {
    const fetchPublicHolidays = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/AU`);
        if (!response.ok) {
          throw new Error('Failed to fetch public holidays');
        }
        const data = await response.json();
        const holidays = data.map((holiday: any) => parseISO(holiday.date));
        setPublicHolidays(holidays);
      } catch (error) {
        console.error('Error fetching public holidays:', error);
        toast.error('Failed to load public holidays. Using weekend validation only.');
      }
    };

    fetchPublicHolidays();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const rows = content.split('\n');
      
      // Skip header row and parse data
      const parsedData: CSVRow[] = [];
      
      // Parse header to identify column indices
      const headers = rows[0].split(',').map(header => header.trim());
      const indices = {
        activityId: headers.findIndex(h => h.toLowerCase().includes('activity id')),
        activityName: headers.findIndex(h => h.toLowerCase().includes('activity name')),
        description: headers.findIndex(h => h.toLowerCase().includes('description')),
        strategy: headers.findIndex(h => h.toLowerCase().includes('strategy')),
        prepDate: headers.findIndex(h => h.toLowerCase().includes('prep date')),
        goDate: headers.findIndex(h => h.toLowerCase().includes('go date')),
      };

      // Validate CSV structure
      if (Object.values(indices).some(index => index === -1)) {
        toast.error('CSV format does not match expected columns');
        return;
      }

      // Parse data rows
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // Skip empty rows
        
        const columns = rows[i].split(',').map(col => col.trim());
        
        // Skip rows with insufficient data
        if (columns.length < 6) continue;

        const prepDateStr = columns[indices.prepDate];
        const goDateStr = columns[indices.goDate];

        // Validate and parse dates
        let prepDate: Date | null = null;
        let goDate: Date | null = null;
        let isValid = true;
        let invalidReason = '';

        try {
          // Parse dates in dd/mm/yyyy format
          prepDate = parse(prepDateStr, 'dd/MM/yyyy', new Date());
          goDate = parse(goDateStr, 'dd/MM/yyyy', new Date());
          
          // Validate prep date
          if (prepDate && isNaN(prepDate.getTime())) {
            isValid = false;
            invalidReason = 'Invalid PREP date format';
          } else if (prepDate && isWeekend(prepDate)) {
            isValid = false;
            invalidReason = 'PREP date falls on a weekend';
          } else if (prepDate && publicHolidays.some(holiday => 
            holiday.getDate() === prepDate!.getDate() && 
            holiday.getMonth() === prepDate!.getMonth() && 
            holiday.getFullYear() === prepDate!.getFullYear())
          ) {
            isValid = false;
            invalidReason = 'PREP date falls on an Australian public holiday';
          }

          // Validate go date
          if (goDate && isNaN(goDate.getTime())) {
            isValid = false;
            invalidReason = 'Invalid GO date format';
          } else if (goDate && isWeekend(goDate)) {
            isValid = false;
            invalidReason = 'GO date falls on a weekend';
          } else if (goDate && publicHolidays.some(holiday => 
            holiday.getDate() === goDate!.getDate() && 
            holiday.getMonth() === goDate!.getMonth() && 
            holiday.getFullYear() === goDate!.getFullYear())
          ) {
            isValid = false;
            invalidReason = 'GO date falls on an Australian public holiday';
          }
        } catch (e) {
          isValid = false;
          invalidReason = 'Invalid date format';
        }

        parsedData.push({
          activityId: columns[indices.activityId],
          activityName: columns[indices.activityName],
          description: columns[indices.description],
          strategy: columns[indices.strategy],
          prepDate: prepDateStr,
          goDate: goDateStr,
          isValid,
          invalidReason: isValid ? undefined : invalidReason
        });
      }

      setCsvData(parsedData);
      setIsUploaded(true);
      toast.success('CSV file parsed successfully');
    };

    reader.readAsText(file);
  };

  const handleSignIn = () => {
    window.gapi.auth2.getAuthInstance().signIn();
  };

  const handleSignOut = () => {
    window.gapi.auth2.getAuthInstance().signOut();
  };

  const handleAddToCalendar = async () => {
    if (!isGapiLoaded || !isAuthorized) {
      toast.error('Please authorize with Google Calendar first');
      return;
    }

    const validEvents = csvData.filter(row => row.isValid);
    if (validEvents.length === 0) {
      toast.error('No valid events to add to calendar');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const event of validEvents) {
        try {
          // Create PREP Date event
          const prepDate = parse(event.prepDate, 'dd/MM/yyyy', new Date());
          const prepEvent = {
            'summary': `PREP: ${event.activityName}`,
            'description': `${event.description}\nStrategy: ${event.strategy}\nActivity ID: ${event.activityId}`,
            'start': {
              'date': format(prepDate, 'yyyy-MM-dd'),
              'timeZone': 'Australia/Sydney'
            },
            'end': {
              'date': format(prepDate, 'yyyy-MM-dd'),
              'timeZone': 'Australia/Sydney'
            }
          };

          await window.gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': prepEvent
          });

          // Create GO Date event
          const goDate = parse(event.goDate, 'dd/MM/yyyy', new Date());
          const goEvent = {
            'summary': `GO: ${event.activityName}`,
            'description': `${event.description}\nStrategy: ${event.strategy}\nActivity ID: ${event.activityId}`,
            'start': {
              'date': format(goDate, 'yyyy-MM-dd'),
              'timeZone': 'Australia/Sydney'
            },
            'end': {
              'date': format(goDate, 'yyyy-MM-dd'),
              'timeZone': 'Australia/Sydney'
            }
          };

          await window.gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': goEvent
          });

          successCount += 2; // Count both events
        } catch (error) {
          console.error('Error adding event to calendar:', error);
          errorCount += 1;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} events to Google Calendar`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} events`);
      }
    } catch (error) {
      console.error('Error adding events to calendar:', error);
      toast.error('Failed to add events to Google Calendar');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">CSV to Calendar Converter</h1>
              <p className="text-gray-600">
                Upload a CSV file to convert to calendar events
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isGapiLoaded && (
                isAuthorized ? (
                  <Button onClick={handleSignOut} variant="outline">
                    Disconnect Google Calendar
                  </Button>
                ) : (
                  <Button onClick={handleSignIn}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Connect Google Calendar
                  </Button>
                )
              )}
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload size={48} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">Upload CSV File</h3>
              <p className="text-sm text-gray-500">
                File should contain columns: Activity ID, Activity Name, Description, Strategy, PREP Date, GO Date
              </p>
              <p className="text-sm text-gray-500">
                Dates must be in dd/mm/yyyy format
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <div>
                <Button 
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  disabled={isProcessing}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select CSV File
                </Button>
              </div>
            </div>
          </div>
          
          {isUploaded && csvData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Preview Data</h2>
                <Button 
                  onClick={handleAddToCalendar} 
                  disabled={!isAuthorized || isProcessing}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Add Valid Events to Calendar
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableCaption>CSV Data Preview</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead>Activity ID</TableHead>
                      <TableHead>Activity Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>PREP Date</TableHead>
                      <TableHead>GO Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((row, index) => (
                      <TableRow key={index} className={row.isValid ? "" : "bg-red-50"}>
                        <TableCell>
                          {row.isValid ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" title={row.invalidReason} />
                          )}
                        </TableCell>
                        <TableCell>{row.activityId}</TableCell>
                        <TableCell>{row.activityName}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.description}</TableCell>
                        <TableCell>{row.strategy}</TableCell>
                        <TableCell>{row.prepDate}</TableCell>
                        <TableCell>{row.goDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!csvData.every(row => row.isValid) && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Invalid entries detected
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          Some events cannot be added to your calendar because they fall on weekends or Australian public holidays.
                          Only valid events will be added to your calendar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CalendarConverter;
