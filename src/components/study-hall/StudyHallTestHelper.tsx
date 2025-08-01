import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudyHallCreation } from '@/hooks/useStudyHallCreation';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const StudyHallTestHelper = () => {
  const { createStudyHall, loading } = useStudyHallCreation();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    data?: any;
  }>>([]);

  const runTest = async (testName: string, testData: any) => {
    setTestResults(prev => [...prev, {
      test: testName,
      status: 'pending',
      message: 'Running test...'
    }]);

    try {
      const result = await createStudyHall(testData);
      
      setTestResults(prev => prev.map(test => 
        test.test === testName 
          ? {
              ...test,
              status: result.success ? 'success' : 'error',
              message: result.success 
                ? 'Test passed successfully' 
                : result.error?.message || 'Test failed',
              data: result.data
            }
          : test
      ));
    } catch (error: any) {
      setTestResults(prev => prev.map(test => 
        test.test === testName 
          ? {
              ...test,
              status: 'error',
              message: error.message || 'Unexpected error',
              data: error
            }
          : test
      ));
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    
    // Test 1: Basic study hall creation
    await runTest('Basic Creation', {
      name: 'Test Study Hall ' + Date.now(),
      description: 'This is a test study hall created by the test helper',
      location: 'Test Location, Test City',
      total_seats: 20,
      rows: 4,
      seats_per_row: 5,
      monthly_price: 1500,
      amenities: ['WiFi', 'Air Conditioning'],
      custom_row_names: ['A', 'B', 'C', 'D']
    });

    // Test 2: Minimum configuration
    await runTest('Minimum Config', {
      name: 'Minimal Hall ' + Date.now(),
      description: 'Minimal test',
      location: 'Minimal Location',
      total_seats: 1,
      rows: 1,
      seats_per_row: 1,
      monthly_price: 500,
      amenities: [],
      custom_row_names: ['A']
    });

    // Test 3: Large configuration
    await runTest('Large Config', {
      name: 'Large Hall ' + Date.now(),
      description: 'Large test configuration',
      location: 'Large Complex, Big City',
      total_seats: 100,
      rows: 10,
      seats_per_row: 10,
      monthly_price: 5000,
      amenities: ['WiFi', 'Air Conditioning', 'Parking', 'Cafeteria'],
      custom_row_names: Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i))
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Study Hall Creation Test Suite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button onClick={runAllTests} disabled={loading}>
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setTestResults([])}
            disabled={loading}
          >
            Clear Results
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.test}</span>
                  <Badge variant={
                    result.status === 'success' ? 'default' :
                    result.status === 'error' ? 'destructive' : 'secondary'
                  }>
                    {result.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {result.message}
                </p>
                {result.data && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      View Data
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};