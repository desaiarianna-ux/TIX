export type TicketInput = {
  ticketNumber?: string;
  plate?: string;
  state?: string;
  issueDate?: string;
  issueTime?: string;
  location?: {
    street?: string;
    crossStreet?: string;
    borough?: string;
    city?: string;
    zip?: string;
  };
  violationCode?: string;
  meterZone?: string;
  officerId?: string;
  precinct?: string;
};

export type ContextInput = {
  inCar?: boolean;
  hasPhotos?: boolean;
  hasPermit?: boolean;
  permitType?: string;
  signageVisible?: "yes" | "no" | "unsure";
  notes?: string;
};

export type ValidationItem = { code: string; message: string; field?: string };
export type ValidationNote = { code: string; message: string };

export type ValidatorOutput = {
  errors: ValidationItem[];
  warnings: ValidationItem[];
  notes: ValidationNote[];
};

export type DefenseArgument = {
  title: string;
  whyItWorks: string;
  evidence: string[];
};
