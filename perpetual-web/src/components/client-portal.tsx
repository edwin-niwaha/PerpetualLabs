import Link from "next/link";
import {
  Bell,
  Mail,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { NotificationRead } from "./notification-read";
import { clientPortal } from "@/lib/portal";
import styles from "@/app/account/portal.module.css";

const date = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
const statuses = {
  pending: "Queued",
  sending: "Sending",
  accepted: "Sent to provider",
  failed: "Needs attention",
};

export async function ClientPortal() {
  let data;
  try {
    data = await clientPortal();
  } catch {
    return (
      <section className={styles.panel} role="alert">
        <h2>Your inbox is temporarily unavailable</h2>
        <p>
          Your account is still secure. Refresh to try loading your updates
          again.
        </p>
        <a href="/account" className="text-link">
          Try again
        </a>
      </section>
    );
  }
  return (
    <div className={styles.portal}>
      <div className={styles.stats} aria-label="Portal overview">
        <a href="#notifications">
          <Bell size={20} />
          <strong>{data.unread_count}</strong>
          <span>Unread notifications</span>
        </a>
        <a href="#email-history">
          <Mail size={20} />
          <strong>{data.emails.length}</strong>
          <span>Recent emails</span>
        </a>
        <a href="#inquiries">
          <MessageSquare size={20} />
          <strong>{data.inquiries.length}</strong>
          <span>Recent inquiries</span>
        </a>
      </div>
      <section
        className={styles.panel}
        id="notifications"
        aria-labelledby="notifications-title"
      >
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Your private inbox</p>
            <h2 id="notifications-title">Notifications</h2>
          </div>
          <a href="/account" className="text-link">
            Refresh inbox
          </a>
        </div>
        <p className={styles.note}>
          Updates from the Perpetual Labs team appear here. Showing your latest
          50.
        </p>
        {data.notifications.length ? (
          <ul className={styles.list}>
            {data.notifications.map((item) => (
              <li key={item.id} data-unread={!item.read_at}>
                <div className={styles.itemHeading}>
                  <h3>{item.title}</h3>
                  {!item.read_at && <span className={styles.badge}>New</span>}
                </div>
                <p className={styles.body}>{item.body}</p>
                <div className={styles.itemFooter}>
                  <time dateTime={item.created_at}>
                    {date(item.created_at)}
                  </time>
                  <NotificationRead id={item.id} read={Boolean(item.read_at)} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>
            You’re all caught up. New account and service updates will appear
            here.
          </p>
        )}
      </section>
      <section
        className={styles.panel}
        id="email-history"
        aria-labelledby="email-title"
      >
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>A copy, always at hand</p>
            <h2 id="email-title">Email activity</h2>
          </div>
          <Mail size={22} />
        </div>
        <p className={styles.note}>
          View recent account emails here. “Sent to provider” means accepted for
          delivery, not confirmed in your inbox.
        </p>
        {data.emails.length ? (
          <div className={styles.emailList}>
            {data.emails.map((item) => (
              <details key={item.id}>
                <summary>
                  <span>
                    {item.subject}
                    <small>{date(item.created_at)}</small>
                  </span>
                  <span className={styles.badge} data-status={item.status}>
                    {statuses[item.status]}
                  </span>
                </summary>
                <p className={styles.body}>{item.body}</p>
                {item.status === "failed" && (
                  <p className={styles.note}>
                    The team has a record of this delivery failure and can retry
                    it.
                  </p>
                )}
              </details>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            No account emails yet. Future email notifications will be listed
            here.
          </p>
        )}
      </section>
      <section
        className={styles.panel}
        id="inquiries"
        aria-labelledby="inquiries-title"
      >
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Keep the conversation going</p>
            <h2 id="inquiries-title">Your inquiries</h2>
          </div>
          <Link href="/contact" className="text-link">
            New inquiry <ArrowUpRight size={16} />
          </Link>
        </div>
        <p className={styles.note}>
          Inquiries submitted while signed in belong to your account. Earlier
          guest submissions stay private.
        </p>
        {data.inquiries.length ? (
          <ul className={styles.list}>
            {data.inquiries.map((item) => (
              <li key={item.id}>
                <div className={styles.itemHeading}>
                  <h3>Inquiry #{item.id}</h3>
                  <time dateTime={item.created_at}>
                    {date(item.created_at)}
                  </time>
                </div>
                <p className={styles.body}>{item.user_message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>
            Have something in mind? Send an inquiry while signed in to keep a
            record here.
          </p>
        )}
      </section>
      <section className={styles.panel} aria-labelledby="services-title">
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Built around your next step</p>
            <h2 id="services-title">Services & what’s next</h2>
          </div>
          <Sparkles size={22} />
        </div>
        <div className={styles.services}>
          {data.services.map((item) => (
            <article key={item.id}>
              <span className={styles.badge}>
                {item.status === "available" ? "Available" : "Coming soon"}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.status === "available" && (
                <Link href="/contact" className="text-link">
                  Talk to our team <ArrowUpRight size={16} />
                </Link>
              )}
            </article>
          ))}
        </div>
        {!data.services.length && (
          <p className={styles.empty}>
            Service announcements will appear here as they become available.
          </p>
        )}
      </section>
    </div>
  );
}
