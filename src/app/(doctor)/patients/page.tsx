
// This file is part of a deprecated route group.
// Please delete the parent directory: src/app/(doctor)/.
// The active page is now located at /src/app/doctor/patients/page.tsx.
export default function DeprecatedDoctorPatientsPage() {
  return (
    <div>
      <h1>This route is deprecated.</h1>
      <p>
        Please ensure the old route group directory src/app/(doctor)/
        has been removed from your project. The correct page is now served
        from /doctor/patients.
      </p>
    </div>
  );
}
