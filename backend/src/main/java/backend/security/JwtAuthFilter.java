package backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import backend.repository.UserRepository;
import backend.model.UserModel;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final AuthenticationEntryPoint authenticationEntryPoint;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService, AuthenticationEntryPoint authenticationEntryPoint, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                // Basic structural check: JWT must have three segments
                if (!StringUtils.hasText(token) || token.split("\\.").length != 3) {
                    authenticationEntryPoint.commence(request, response, new AuthenticationException("Malformed JWT") {});
                    return;
                }

                if (jwtUtil.validate(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
                    String email = jwtUtil.extractEmail(token);
                    Long tokenVersion = jwtUtil.extractTokenVersion(token);
                    UserModel user = userRepository.findByEmail(email).orElse(null);
                    if (user != null) {
                        Long currentVersion = user.getTokenVersion() == null ? 0L : user.getTokenVersion();
                        if (tokenVersion != null && tokenVersion.equals(currentVersion)) {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                        } else {
                            // Version mismatch: treat as invalid
                            authenticationEntryPoint.commence(request, response, new AuthenticationException("Invalid token version") {});
                            return;
                        }
                    } else {
                        // No such user for subject
                        authenticationEntryPoint.commence(request, response, new AuthenticationException("Unknown user") {});
                        return;
                    }
                } else {
                    // Invalid signature/claims/expired
                    authenticationEntryPoint.commence(request, response, new AuthenticationException("Invalid JWT") {});
                    return;
                }
            } catch (Exception e) {
                // On any parsing/validation exception, respond 401 immediately
                authenticationEntryPoint.commence(request, response, new AuthenticationException("JWT error") {});
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
