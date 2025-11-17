import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does dress rental work?",
    answer: "Browse our collection, select your desired dress, and contact us through WhatsApp to book. We'll arrange pickup or delivery, and you can enjoy wearing a designer dress for your special occasion. Return it after your event, and we'll take care of the cleaning."
  },
  {
    question: "How long can I rent a dress?",
    answer: "Our standard rental period is typically 3-5 days, which gives you time before and after your event. If you need the dress for a longer period, please contact us and we'll be happy to accommodate your needs with custom rental terms."
  },
  {
    question: "What if the dress doesn't fit?",
    answer: "We provide detailed size information for each dress. We recommend contacting us before booking to discuss sizing and ensure the perfect fit. If needed, we can arrange a fitting appointment at our location."
  },
  {
    question: "Are the dresses cleaned between rentals?",
    answer: "Absolutely! Every dress is professionally cleaned and inspected after each rental to ensure it's in perfect condition. We take pride in maintaining the highest quality standards for all our designer pieces."
  },
  {
    question: "What is your cancellation policy?",
    answer: "We understand that plans can change. Please contact us as soon as possible if you need to cancel or reschedule your rental. Our team will work with you to find the best solution based on your specific situation."
  },
  {
    question: "Do you offer delivery and pickup?",
    answer: "Yes! We offer convenient delivery and pickup services in the local area. The cost varies depending on your location. Contact us for more details about delivery options and pricing."
  },
  {
    question: "Can I reserve a dress in advance?",
    answer: "Yes, we highly recommend reserving your dress in advance, especially for popular dates and seasons. Contact us via WhatsApp with your event date and preferred dress to check availability and secure your booking."
  },
  {
    question: "What happens if the dress gets damaged?",
    answer: "Minor wear and tear is expected and covered. However, significant damage may incur repair costs. We recommend treating the dress with care. If any accidents occur, please inform us immediately so we can assess the situation fairly."
  }
];

export default function FAQ() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about renting from ED ATELIER
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-lg px-6 bg-card/50 backdrop-blur-sm"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5">
                <span className="font-semibold text-lg">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-10">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a
            href="https://api.whatsapp.com/send?phone=9613836748"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            Contact us on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
