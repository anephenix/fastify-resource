Feature: Login

  Scenario: Logging in with a password
    Given a registered user "alice" with email "alice@example.com"
    When I log in with username "alice" and password "hunter22"
    Then I should land on the dashboard

  Scenario: Logging in with a magic link
    Given a registered user "erin" with email "erin@example.com"
    When I request a magic link for "erin@example.com"
    And I complete the magic-link login using the code that was sent
    Then I should land on the dashboard

  Scenario: Logging in with TOTP after enrolling MFA
    Given a registered user "dave" with email "dave@example.com"
    And "dave" has enrolled in TOTP MFA
    When I log in with username "dave" and password "hunter22"
    Then I should be asked for an MFA code
    When I enter the current TOTP code for "dave"
    Then I should land on the dashboard

  Scenario: A magic link cannot bypass TOTP MFA
    Given a registered user "faye" with email "faye@example.com"
    And "faye" has enrolled in TOTP MFA
    When I request a magic link for "faye@example.com"
    And I complete the magic-link login using the code that was sent
    Then I should be asked for an MFA code
    When I enter the current TOTP code for "faye"
    Then I should land on the dashboard
