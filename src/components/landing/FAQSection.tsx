import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: "How do I book a study hall?",
    answer: "Simply register for an account, browse available study halls in your area, select your preferred dates and seats, and complete the payment. You'll receive instant confirmation via email and SMS."
  },
  {
    id: 2,
    question: "What payment methods do you accept?",
    answer: "We accept UPI, credit/debit cards, net banking, and digital wallets through Razorpay. We also offer offline payment options for select locations."
  },
  {
    id: 3,
    question: "Can I cancel or modify my booking?",
    answer: "Yes, you can cancel or modify your booking up to 24 hours before your session starts. Cancellations made within the allowed timeframe are eligible for a full refund."
  },
  {
    id: 4,
    question: "Are the study halls equipped with Wi-Fi?",
    answer: "Yes, all our partner study halls provide high-speed Wi-Fi, comfortable seating, proper lighting, and air conditioning. Some locations also offer additional amenities like printing services and refreshments."
  },
  {
    id: 5,
    question: "How does the rewards system work?",
    answer: "You earn points for every booking, referral, and completed session. These points can be redeemed for discounts on future bookings. Additionally, we offer special coupons and seasonal promotions."
  },
  {
    id: 6,
    question: "Is customer support available?",
    answer: "Yes, our customer support team is available 24/7 via chat, email, and phone. We're here to help with any questions about bookings, payments, or technical issues."
  }
];

const FAQSection = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Get answers to the most common questions about our platform and services.
          </p>
          <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isOpen = openItems.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="bg-card border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
                >
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                    onClick={() => toggleItem(faq.id)}
                  >
                    <span className="font-semibold text-foreground pr-4">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  
                  <div
                    className={`transition-all duration-200 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}
                  >
                    <div className="px-6 pb-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;