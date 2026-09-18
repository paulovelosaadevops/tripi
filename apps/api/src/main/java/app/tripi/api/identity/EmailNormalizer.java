package app.tripi.api.identity;

import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
class EmailNormalizer {

  String normalize(String email) {
    if (email == null) {
      return "";
    }
    return email.trim().toLowerCase(Locale.ROOT);
  }
}
