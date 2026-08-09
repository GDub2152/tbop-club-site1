
document.addEventListener("DOMContentLoaded",()=>{
  const configured=Boolean(window.TBOP?.api?.configured?.());

  const signupNotice=document.getElementById("signupNotice");
  if(signupNotice){
    signupNotice.textContent=configured
      ?"SECURE SIGNUP — connected to Supabase."
      :"Signup unavailable until Supabase is configured.";
  }

  document.getElementById("memberSignupForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!configured){alert("Supabase is not configured.");return}
    const p1=signupPassword.value,p2=signupPassword2.value;
    if(p1!==p2){alert("Passwords do not match.");return}
    const btn=document.getElementById("signupBtn");
    try{
      btn.disabled=true;btn.textContent="Creating account…";
      await TBOP.api.signUpMember({
        email:signupEmail.value.trim(),
        password:p1,
        firstName:signupFirstName.value.trim(),
        lastName:signupLastName.value.trim(),
        callsign:signupCallsign.value.trim()||null,
        mobilePhone:signupPhone.value.trim()||null,
        city:signupCity.value.trim()||null,
        state:signupState.value.trim().toUpperCase()||null
      });
      alert("Account created. Check your email for a confirmation link if email confirmation is enabled. After confirmation, use Member Login.");
      location.href="member-login.html";
    }catch(err){
      alert("Could not create account: "+(err.message||err));
      btn.disabled=false;btn.textContent="Create My Account";
    }
  });

  document.getElementById("forgotPasswordForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const btn=document.getElementById("forgotBtn");
    try{
      btn.disabled=true;btn.textContent="Sending…";
      const redirect=new URL("reset-password.html",location.href).href;
      await TBOP.api.sendPasswordReset(forgotEmail.value.trim(),redirect);
      alert("If that email belongs to an account, a password reset link has been sent.");
      location.href="member-login.html";
    }catch(err){
      alert("Could not send reset link: "+(err.message||err));
      btn.disabled=false;btn.textContent="Send Reset Link";
    }
  });

  document.getElementById("resetPasswordForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    if(resetPassword.value!==resetPassword2.value){alert("Passwords do not match.");return}
    try{
      await TBOP.api.updatePassword(resetPassword.value);
      alert("Password changed. You can now sign in.");
      location.href="member-login.html";
    }catch(err){alert("Could not change password: "+(err.message||err))}
  });

  document.getElementById("changePasswordForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    if(memberNewPassword.value!==memberNewPassword2.value){alert("Passwords do not match.");return}
    try{
      await TBOP.api.updatePassword(memberNewPassword.value);
      e.target.reset();
      alert("Password updated.");
    }catch(err){alert("Could not update password: "+(err.message||err))}
  });
});
