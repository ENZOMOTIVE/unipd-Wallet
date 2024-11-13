## This is an Issuer-Holder-Verifier Model

## Project Description
This project addresses the inefficiencies in traditional credential verification methods, particularly in recruitment and admissions, where manual processes can lead to delays, errors, and risks of fraudulent information. The solution leverages blockchain technology to securely store credential information in the issuer’s part of the system, enhancing trust and traceability in the verification process. By adopting the OpenID for Verifiable Presentations (OID4VP) and OpenID for Verifiable Credential Issuance (OID4VCI) standards, this system enables users to manage and share verified digital credentials seamlessly via a secure wallet application. Using the ED25519 encryption algorithm ensures that sensitive information remains encrypted and protected, making it nearly impossible for unauthorized parties to tamper with or misuse the data.

Through this approach, applicants can instantly share verifiable credentials with organizations, simply by scanning a QR code and confirming the action, eliminating the need for time-consuming manual checks. Organizations benefit from receiving secure, tamper-proof credentials directly from the blockchain, streamlining the verification process and significantly reducing administrative load and errors. This solution creates a faster, more reliable, and fraud-resistant credential exchange ecosystem, improving the overall experience for applicants and organizations alike while building a foundation of trust in digital credentialing.

## Working Video

Frontend Showcase

https://github.com/user-attachments/assets/de882ec9-550a-4b69-9da2-08e4b6b1dd5e

Backend Showcase

https://github.com/user-attachments/assets/1dd8910e-d19d-4517-b6ec-a69aecb4d02d






## Workflow Diagram
![Refined systeArch](https://github.com/user-attachments/assets/3c373711-1ca2-46b5-a928-3d6c0654d675)

![Diagram](https://github.com/user-attachments/assets/6c8a30a5-acad-4c4d-ba46-39724ca1db3b)



## Issuer - Wallet (OID4VC)
![Issuer_wallet](https://github.com/user-attachments/assets/1910ed5a-b5d0-4cc4-b565-a2991f9b9a85)

## Wallet - Verifier (OID4VP)
![Wallet-Verifier](https://github.com/user-attachments/assets/7f34fa72-8eec-4e6b-a85c-004dba549549)


## Wallet
This is the Wallet link deploed on vercel:  [Wallet vercel](https://unipd-wallet.vercel.app)
## Issuer
This is the Issuer link deployed on vercel:  [Issuer vercel](https://issuerunipd.vercel.app/)
## Job Portal
This is the verifier deployed on vercel [Verifier](https://jobverifier.vercel.app/)

## When running locally
Issuer backend: 3001

Issuer frontend: 3000

Wallet backend: 3002

Wallet frontend: 3003

Verifier backend: 3006

Verifier frontend: 3004

## Project Proposal

We assume we will have a description of requirements associated with the possibility of expressing
a candidacy for a job position according to the ELMO model (https://github.com/emrex-eu/elmoschemas). The requirements that can be expressed using the ELMO schemas are limited to
academic results, we are aware of this limitation, but we consider it acceptable for the scope of the
current project.

We assume that a user interested in expressing a candidacy for a given job position has a personal
digital wallet such as the one developed by EUDI (https://github.com/eu-digital-identitywallet/eudi-doc-architecture-and-reference-framework/blob/main/README.md)
The main goal of this project is to develop a service that is capable of generating a set of constraints
expressed according to the ELMO framework and of transforming that set of constraints into a
request for a Verifiable Presentation usable with the EUDI wallet either to generate a Verifiable
Presentation capable of proving the fact that the owner of the wallet satisfies the given constraints
or to notify the user of the impossibility to satisfy the constraints because of some missing
Verifiable Credential.

The way the request is presented to the wallet has to adhere to the “OpenID for Verifiable
Presentations” standard (https://openid.net/specs/openid-4-verifiable-presentations-1_0.html).
Similarly, the format for the Verifiable Presentation generated by the wallet has to follow OID4VP
standard.

## Credential types:
const credentialTypes = {

  'UniversityDegree': ['name', 'degreeType', 'university', 'graduationDate'],
  
  'DriverLicense': ['name', 'licenseNumber', 'issueDate', 'expiryDate'],
  
  'PID': ['name', 'idNumber', 'dateOfBirth', 'address'],
  
  'ResidenceCertificate': ['name', 'address', 'issueDate', 'validUntil']

};

## How to run 
TO run the frontend the command is:

npm start

To run the backend the command is:

node server.js

