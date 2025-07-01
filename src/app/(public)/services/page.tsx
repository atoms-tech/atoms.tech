export default function ServicesPage() {
    const services = [
        {
            title: 'AI-Powered Requirements Analysis',
            description:
                'Automated analysis of system requirements using advanced AI algorithms to identify gaps, inconsistencies, and potential issues.',
        },
        {
            title: 'Natural Language Processing',
            description:
                'Convert complex technical documents into structured requirements using state-of-the-art NLP techniques.',
        },
        {
            title: 'Requirements Validation',
            description:
                'Automated validation of requirements against industry standards and best practices.',
        },
        {
            title: 'Traceability Analysis',
            description:
                'AI-driven analysis of requirement dependencies and relationships to ensure complete coverage.',
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-center mb-12">
                Our Services
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {services.map((service, index) => (
                    <div
                        key={index}
                        className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                        <h2 className="text-2xl font-semibold mb-4">
                            {service.title}
                        </h2>
                        <p className="text-gray-600">{service.description}</p>
                    </div>
                ))}
            </div>
            <div className="mt-16 text-center">
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                    Our AI-powered platform helps system engineers streamline
                    their requirements analysis process, saving time and
                    improving accuracy in system development.
                </p>
            </div>
        </div>
    );
}
