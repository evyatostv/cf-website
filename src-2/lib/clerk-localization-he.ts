// Hebrew localization overrides for Clerk, layered on top of the built-in heIL.
// heIL leaves ~23 error strings and a few placeholders untranslated (they fall
// back to English), and shows a "להמשיך אל <app>" subtitle we don't want.
// This merges Hebrew for all of those. Reusable by the real migration too.
import { heIL } from "@clerk/localizations";

export const clerkHebrewLocalization = {
  ...heIL,

  // Sign-up password field showed the English "Create a password".
  formFieldInputPlaceholder__signUpPassword: "צור/י סיסמה",

  // Remove the "להמשיך אל <application name>" subtitle on the sign-up / sign-in cards.
  signUp: {
    ...heIL.signUp,
    start: { ...heIL.signUp?.start, subtitle: "" },
  },
  signIn: {
    ...heIL.signIn,
    start: { ...heIL.signIn?.start, subtitle: "" },
  },

  // Translate every error heIL left in English (void 0). Keyed by Clerk error code.
  unstable__errors: {
    ...heIL.unstable__errors,
    api_key_name_already_exists: "שם מפתח ה-API כבר קיים.",
    api_key_usage_exceeded: "הגעת למגבלת השימוש. ניתן להסיר את המגבלה על ידי שדרוג לתוכנית בתשלום.",
    form_code_incorrect: "הקוד שגוי. נסו שוב.",
    form_new_password_matches_current: "הסיסמה החדשה אינה יכולה להיות זהה לסיסמה הנוכחית.",
    form_param_format_invalid: "הפורמט אינו תקין.",
    form_param_nil: "שדה זה הוא חובה.",
    form_param_type_invalid: "הערך שהוזן אינו תקין.",
    form_param_type_invalid__email_address: "כתובת האימייל אינה תקינה.",
    form_param_type_invalid__phone_number: "מספר הטלפון אינו תקין.",
    form_param_value_invalid: "הערך שהוזן אינו תקין.",
    form_password_compromised__sign_in:
      "ייתכן שהסיסמה נחשפה בדליפת מידע. להגנה על החשבון, המשיכו בשיטת התחברות אחרת.",
    form_password_incorrect: "הסיסמה שגויה. נסו שוב.",
    form_password_length_too_short: "הסיסמה קצרה מדי. עליה להכיל לפחות 8 תווים.",
    form_password_untrusted__sign_in:
      "ייתכן שהסיסמה נחשפה. להגנה על החשבון, המשיכו בשיטת התחברות חלופית. תתבקשו לאפס את הסיסמה לאחר ההתחברות.",
    form_username_invalid_character: "שם המשתמש מכיל תווים לא חוקיים.",
    form_username_invalid_length: "שם המשתמש חייב להכיל בין {{min_length}} ל-{{max_length}} תווים.",
    insufficient_seats_change_plan:
      "לארגון אין מספיק מושבים כדי להזמין את מספר החברים הרצוי. עברו לתוכנית שתומכת במספר החברים הרצוי.",
    insufficient_seats_contact_support:
      "לארגון אין מספיק מושבים כדי להזמין את מספר החברים הרצוי. אנא פנו לתמיכה.",
    oauth_access_denied: "לא אישרת גישה לחשבון שלך.",
    organization_domain_exists_for_enterprise_connection: "הדומיין כבר קיים עבור חיבור ארגוני.",
    organization_not_found_or_unauthorized: "אינך עוד חבר בארגון זה. אנא בחרו או צרו ארגון אחר.",
    organization_not_found_or_unauthorized_with_create_organization_disabled:
      "אינך עוד חבר בארגון זה. אנא בחרו ארגון אחר.",
    web3_missing_identifier: "לא נמצא תוסף ארנק Web3. אנא התקינו אחד כדי להמשיך.",
  },
} as typeof heIL;
