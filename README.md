Server Assignment

Design a backend architecture and write code, with two API’s (Signup, Login) with MongoDB as database,

Database Collections: 1 user collection

\*\*You can create additional collections if required.

Signup: Take users user name and password, create an account and respond with 200 saying that account created

Login API:
Input: username and password

     Login API requires 3 checks and to respond with 200, the login request should satisfy all 3.

Regular username and password validation: check username and password is matching or not
Barring every 5th login: From platform point of view, across all the users, block every 5th login.
Example: let's say there are 3 users - u1, u2, u3. At 10:30 u1 logins(1st login), 10:31 u2 logins(2nd login), 10:33 u2 logins again(3rd login), 10:40 u1 logins again (4th login) and at 10:45 u3 logins (5th login) -- In the above scenario, u3 login should be barred as its the 5th login, and subsequently bar all the 5 multiple logins.

3rd party login validation: Apart from above 2 steps, there should be a 3rd party service which responds with ‘true’ or ‘false’ (refer point ‘e’). Approve those login requests when the 3rd party service responds with ‘true’.
This 3rd party should be a single process, and should always keep on running.
This should not be an API - request response cycle.
All the login requests should send a message to this 3rd party service, wait for its.return message and validate the login request based on the return message from 3rd party
The 3rd party service should be implemented by you, and it should listen on one input channel and publish the results on a different one
The logic in 3rd party service is
if((Math.random() % 2) === 0){
//respond with true
}
else{
//respond with false
}
Can implement any queueing mechanism here - (Redis, AMQP are preferred)
