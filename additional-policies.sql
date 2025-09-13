-- Additional policies needed for phone authentication signup

-- Allow service role to insert users during signup process
CREATE POLICY "Allow service role to insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Allow service role to insert user tokens during signup  
CREATE POLICY "Allow service role to insert user tokens" ON public.user_tokens
  FOR INSERT WITH CHECK (true);

-- Allow service role to update users during verification
CREATE POLICY "Allow service role to update users" ON public.users
  FOR UPDATE USING (true);

-- Allow service role to update user tokens
CREATE POLICY "Allow service role to update user tokens" ON public.user_tokens
  FOR UPDATE USING (true);