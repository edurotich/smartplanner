import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json()
    
    console.log('M-PESA Callback received:', callbackData)
    
    const supabase = await createClient()
    
      // Extract data from M-PESA callback
      const { Body } = callbackData
      const { stkCallback } = Body
      const checkoutRequestId = stkCallback.CheckoutRequestID
      
      if (stkCallback.ResultCode === 0) {
        // Payment successful
        const { CallbackMetadata } = stkCallback
        const metadata = CallbackMetadata.Item
        
        // Extract payment details
        const amount = metadata.find((item: { Name: string; Value: number }) => item.Name === 'Amount')?.Value
        const mpesaReceiptNumber = metadata.find((item: { Name: string; Value: string }) => item.Name === 'MpesaReceiptNumber')?.Value
        const phoneNumber = metadata.find((item: { Name: string; Value: string }) => item.Name === 'PhoneNumber')?.Value
        const transactionDate = metadata.find((item: { Name: string; Value: string }) => item.Name === 'TransactionDate')?.Value
        
        // Calculate tokens (1 KES = 1 token)
        const tokensToAdd = Math.floor(amount)
        
        // Find user by phone number
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('phone', phoneNumber)
          .single()
        
        if (user) {
          // Record payment
          await supabase.from('payments').insert({
            user_id: user.id,
            mpesa_receipt: mpesaReceiptNumber,
            checkout_request_id: checkoutRequestId,
            amount: amount,
            tokens_added: tokensToAdd,
            transaction_date: transactionDate
          })        // Update user token balance
        await supabase.rpc('update_user_tokens', {
          user_uuid: user.id,
          token_change: tokensToAdd
        })
        
        console.log(`Added ${tokensToAdd} tokens to user ${user.id}`)
      }
    } else {
      // Payment failed
      console.log('Payment failed:', stkCallback.ResultDesc)
    }
    
    return NextResponse.json({ message: 'Callback processed' })
    
  } catch (error) {
    console.error('Error processing M-PESA callback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
