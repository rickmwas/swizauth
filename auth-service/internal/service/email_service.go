package service

import (
	"fmt"
	"log"
	"net/mail"
	"net/smtp"
	"time"
)

// EmailService defines the methods to send authflow transactional emails
type EmailService interface {
	SendVerificationEmail(toEmail string, token string) error
	SendPasswordResetEmail(toEmail string, token string) error
}

type emailService struct {
	host   string
	port   int
	user   string
	pass   string
	sender string
	env    string
}

// NewEmailService returns a new EmailService implementation.
// If host is empty, it acts as a mock service logging to stdout.
func NewEmailService(host string, port int, user string, pass string, sender string, env string) EmailService {
	return &emailService{
		host:   host,
		port:   port,
		user:   user,
		pass:   pass,
		sender: sender,
		env:    env,
	}
}

func (s *emailService) SendVerificationEmail(toEmail string, token string) error {
	link := fmt.Sprintf("http://localhost:3000/auth/verify-email?token=%s", token)
	if s.host == "" {
		fmt.Printf("{\"timestamp\":\"%s\",\"level\":\"INFO\",\"service\":\"auth-service\",\"message\":\"[DEVELOPMENT] Email verification link for %s: %s\"}\n",
			time.Now().Format(time.RFC3339), toEmail, link)
		return nil
	}

	subject := "Verify your TSAUTH Email"
	body := fmt.Sprintf("Hello,\n\nPlease verify your email by clicking the link below:\n%s\n\nThis link will expire in 24 hours.", link)
	return s.sendMail(toEmail, subject, body)
}

func (s *emailService) SendPasswordResetEmail(toEmail string, token string) error {
	link := fmt.Sprintf("http://localhost:3000/auth/password-reset/confirm?token=%s", token)
	if s.host == "" {
		fmt.Printf("{\"timestamp\":\"%s\",\"level\":\"INFO\",\"service\":\"auth-service\",\"message\":\"[DEVELOPMENT] Password reset link for %s: %s\"}\n",
			time.Now().Format(time.RFC3339), toEmail, link)
		return nil
	}

	subject := "Reset your TSAUTH Password"
	body := fmt.Sprintf("Hello,\n\nYou requested a password reset. Please click the link below to confirm:\n%s\n\nThis link will expire in 1 hour.", link)
	return s.sendMail(toEmail, subject, body)
}

func (s *emailService) sendMail(to string, subject string, body string) error {
	from := mail.Address{Name: "TSAUTH Identity", Address: s.sender}
	toAddr := mail.Address{Address: to}

	headers := make(map[string]string)
	headers["From"] = from.String()
	headers["To"] = toAddr.String()
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/plain; charset=\"utf-8\""

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	auth := smtp.PlainAuth("", s.user, s.pass, s.host)

	err := smtp.SendMail(addr, auth, s.sender, []string{to}, []byte(message))
	if err != nil {
		log.Printf("Failed to send email to %s via %s: %v\n", to, addr, err)
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("Email successfully sent to %s via SMTP (%s)\n", to, s.host)
	return nil
}
