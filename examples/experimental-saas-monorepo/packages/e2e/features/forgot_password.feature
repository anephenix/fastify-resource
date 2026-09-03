Feature: Forgot password

  Scenario: Resetting a forgotten password
    Given a registered user "frank" with email "frank@example.com"
    When I request a password reset for "frank@example.com"
    And I complete the password reset with the token that was sent, setting the password to "newpassword123"
    Then I should be able to log in with username "frank" and password "newpassword123"
