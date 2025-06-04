## **REPLIT AGENT FOUNDATIONAL INSTRUCTIONS**

### **MANDATORY QUALITY STANDARDS \- READ BEFORE ANY TASK**

#### **DEFINITION OF "COMPLETE"**

* A feature is NOT complete until it works across ALL relevant user flows  
* "Working on my machine" is not complete \- test in the actual deployed environment  
* Visual elements must be consistent across all pages that use them  
* User authentication/authorization must work on every protected page

#### **PRE-IMPLEMENTATION CHECKLIST**

Before writing ANY code:

1. **Identify ALL pages/components** that will be affected by this change  
2. **Map the complete user journey** \- from login to logout across all affected pages  
3. **List existing components** that might already solve part of the problem  
4. **Check for similar patterns** already implemented in the codebase

#### **MANDATORY TESTING PROTOCOL**

After ANY code change, you MUST:

1. **Test on ALL affected pages** \- no exceptions  
2. **Test both desktop and mobile views** (use browser dev tools)  
3. **Test with and without authentication** (logout/login between tests)  
4. **Test error states** (network failures, API errors, missing data)  
5. **Verify browser console shows NO errors** during normal operation

#### **SECURITY REQUIREMENTS**

Every implementation MUST:

* Verify user authentication before showing protected content  
* Handle logout from ANY page in the application  
* Clear sensitive data from localStorage on logout  
* Validate user permissions on both client AND server side  
* Never expose API keys or sensitive data in client code

#### **CODE QUALITY STANDARDS**

* **Reuse existing components** instead of recreating functionality  
* **Follow established patterns** already present in the codebase  
* **Handle loading states** for any async operations  
* **Handle error states** with user-friendly messages  
* **Use TypeScript properly** \- no `any` types without justification

#### **COMMON FAILURE PATTERNS TO AVOID**

1. **Partial Implementation**: Building a component but not using it everywhere needed  
2. **Inconsistent UI**: Different header styles, button patterns, or layouts across pages  
3. **Authentication Gaps**: Some pages have logout, others don't  
4. **Error Blindness**: Not testing what happens when APIs fail  
5. **Mobile Ignorance**: Only testing on desktop view

#### **VERIFICATION CHECKLIST (RUN BEFORE CLAIMING COMPLETE)**

□ Feature works on ALL relevant pages  
 □ Consistent visual design across all pages  
 □ Authentication/logout works from every page  
 □ Mobile responsive design verified  
 □ Error handling tested and working  
 □ Browser console shows no errors  
 □ User can complete full workflows without issues  
 □ No API keys or secrets exposed in client code

#### **COMMUNICATION STANDARDS**

* **Never claim "complete" unless ALL verification steps pass**  
* **List specific pages/flows tested** in your response  
* **Report any limitations or known issues** discovered during testing  
* **Provide specific steps to reproduce** any problems found

#### **TECHNICAL ENVIRONMENT NOTES**

* **Frontend**: React \+ TypeScript \+ Vite \+ Tailwind CSS \+ Shadcn/ui  
* **Backend**: Express.js \+ TypeScript \+ PostgreSQL \+ Drizzle ORM  
* **Authentication**: JWT tokens with localStorage persistence  
* **Deployment**: Replit with hot reloading  
* **User Base**: Professional book resellers using mobile devices primarily

#### **CRITICAL FILES \- UNDERSTAND BEFORE MODIFYING**

* `client/src/App.tsx` \- Main routing and authentication  
* `client/src/hooks/use-auth.ts` \- Authentication logic  
* `client/src/components/global-header.tsx` \- Consistent header with logout  
* `server/auth-middleware.ts` \- Server-side authentication  
* `shared/schema.ts` \- Database schema and validation

#### **WHEN TO ASK FOR CLARIFICATION**

* Requirements seem ambiguous or incomplete  
* Multiple implementation approaches are possible  
* Breaking changes might affect existing functionality  
* Security implications are unclear

**FAILURE TO FOLLOW THESE STANDARDS WILL RESULT IN REJECTION OF INCOMPLETE WORK**

