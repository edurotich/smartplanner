'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

export default function TestDialogsPage() {
  const router = useRouter();
  const [showDialog1, setShowDialog1] = useState(false);
  const [showDialog2, setShowDialog2] = useState(false);
  const [formData, setFormData] = useState({
    field1: '',
    field2: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Form submitted successfully: ' + JSON.stringify(formData));
    setShowDialog1(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dialog Test Page</h1>
          <Button variant="outline" onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Dialog Test 1: Basic Dialog</CardTitle>
              <CardDescription>
                This tests a basic dialog with a form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowDialog1(true)} 
                className="w-full"
              >
                Open Dialog 1
              </Button>
              
              <Dialog open={showDialog1} onOpenChange={setShowDialog1}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Test Dialog</DialogTitle>
                    <DialogDescription>
                      This is a test dialog to verify dialog functionality.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="field1">Field 1</Label>
                      <Input
                        id="field1"
                        value={formData.field1}
                        onChange={(e) => setFormData(prev => ({ ...prev, field1: e.target.value }))}
                        placeholder="Enter field 1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="field2">Field 2</Label>
                      <Input
                        id="field2"
                        value={formData.field2}
                        onChange={(e) => setFormData(prev => ({ ...prev, field2: e.target.value }))}
                        placeholder="Enter field 2"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDialog1(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Submit
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dialog Test 2: With Trigger</CardTitle>
              <CardDescription>
                This tests a dialog with DialogTrigger component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">Open Dialog 2</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dialog with Trigger</DialogTitle>
                    <DialogDescription>
                      This dialog uses the DialogTrigger component.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p>This is test content inside the dialog.</p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setShowDialog2(false)}>Close</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="text-blue-800 font-medium mb-2">Testing Instructions</h2>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>Click each dialog button to test if dialogs open properly</li>
            <li>Fill out forms and test submission</li>
            <li>Test closing dialogs with close buttons and clicks outside</li>
            <li>Once these test dialogs work, try the actual Project, Expense, and Income dialogs</li>
          </ol>
        </div>

        <div className="flex space-x-4">
          <Button onClick={() => router.push('/projects')} variant="outline">
            Go to Projects
          </Button>
          <Button onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}