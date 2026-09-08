!define MUI_LICENSEPAGE_CHECKBOX
!define MUI_LICENSEPAGE_TEXT_TOP "Please read the 505th Hub Terms of Service before installing."
!define MUI_LICENSEPAGE_TEXT_BOTTOM "Accept the terms to continue, or choose Cancel to exit setup."
!define MUI_LICENSEPAGE_CHECKBOX_TEXT "I accept the 505th Hub Terms of Service"
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to 505th Hub Setup"
  !define MUI_WELCOMEPAGE_TEXT "Install the 505th Expeditionary Force member application.$\r$\n$\r$\nSetup will ask you to accept the Terms of Service and choose an installation folder.$\r$\n$\r$\n505th Aux Mod Team - RevGamer (S.Davy)$\r$\n$\r$\nClose any running copy of 505th Hub before continuing."
  !insertmacro MUI_PAGE_WELCOME
!macroend
