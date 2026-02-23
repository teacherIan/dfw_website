import { motion } from 'framer-motion';
import { fontFamilyMap } from '../../constants';
import styles from './ContactOverlay.module.css';

/**
 * ContactOverlay component displaying contact information
 * Blueprint-style floating text at bottom of screen
 * Shown after the splat transition to the logo completes
 */
const ContactOverlay = () => {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Title block - bottom left, blueprint style */}
      <motion.div
        className={styles.titleBlock}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.25 }}
      >
        <h2
          className={styles.title}
          style={{ fontFamily: fontFamilyMap['Caveat'] }}
        >
          Get in Touch
        </h2>

        <div className={styles.infoGrid}>
          {/* Phone */}
          <div className={styles.infoRow}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>(207) 654-2692</span>
          </div>

          {/* Emails */}
          <div className={styles.infoRow}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div className={styles.emailList}>
              <a href="mailto:matfoundwood@gmail.com" className={styles.link}>matfoundwood@gmail.com</a>
              <a href="mailto:wiffle@tdstelme.net" className={styles.link}>wiffle@tdstelme.net</a>
            </div>
          </div>

          {/* Facebook */}
          <div className={styles.infoRow}>
            <svg className={styles.icon} fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <a href="https://www.facebook.com/DougsFoundWood/" target="_blank" rel="noopener noreferrer" className={styles.link}>
              DougsFoundWood
            </a>
          </div>

          {/* Location */}
          <div className={styles.infoRow}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Athens, ME</span>
          </div>
        </div>

        <p className={styles.tagline}>Always Unique. Handcrafted in Maine.</p>
      </motion.div>
    </motion.div>
  );
};

export default ContactOverlay;
