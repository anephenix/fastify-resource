Feature: Logout

  Scenario: Logging out ends the session
    Given a registered user "grace" with email "grace@example.com"
    When I log in with username "grace" and password "hunter22"
    Then I should land on the dashboard
    When I log out
    Then I should land on the home page
    And visiting the dashboard should redirect me to login
