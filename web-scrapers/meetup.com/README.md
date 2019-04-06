This specific site we are using the Meetup.com API endpoint resource
```https://api.meetup.com/find/upcoming_events```

We are NOT webscraping this provider since the API is available for us to easily obtain the data from.

Meetup no longer allows for a simple api key based authorization.

They require oAuth2 auth flow to obtain access_token / refresh_token.

The access_tokens from meetup expire in 3600s (1 hour). When the access_token expires we must use the refresh token to obtain a new access_token and then we can re-attempt the request to the meetup endpoint resource.
```
{
    "access_token": "69f97131cc18cf76fb3c76d9c96d660e",
    "refresh_token": "a8783c7e2eea1b797a07eab51286fc9a",
    "token_type": "bearer",
    "expires_in": 3600
}

curl -H "Authorization: Bearer 69f97131cc18cf76fb3c76d9c96d660e" https://api.meetup.com/find/upcoming_events

```

Since the meetup site does not provide terribly sensitive data we are going to perform a cardinal sin and put the oAuth credentials on this repo. We can always re-create them and update the config file with the new ones when necessary.