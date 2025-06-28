<?php
declare(strict_types=1);

use Migrations\AbstractSeed;

/**
 * Clients seed.
 */
class ClientsSeed extends AbstractSeed
{
    /**
     * Run Method.
     *
     * Write your database seeder using this method.
     *
     * More information on writing seeds is available here:
     * https://book.cakephp.org/phinx/0/en/seeding.html
     *
     * @return void
     */
    public function run(): void
    {
        $data = [
            [
                'organization_id' => 1, // Assuming organization with ID 1 exists
                'name' => 'TechStartup Solutions',
                'email' => 'contact@techstartup.com',
                'phone' => '+1 (555) 123-4567',
                'website' => 'https://techstartup.com',
                'description' => 'A cutting-edge technology startup focused on AI and machine learning solutions for businesses.',
                'logo_path' => '',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'organization_id' => 1,
                'name' => 'Green Earth Consulting',
                'email' => 'info@greenearth.org',
                'phone' => '+1 (555) 987-6543',
                'website' => 'https://greenearth.org',
                'description' => 'Environmental consulting firm helping businesses achieve sustainability goals and reduce carbon footprint.',
                'logo_path' => '',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'organization_id' => 1,
                'name' => 'Urban Fitness Studio',
                'email' => 'hello@urbanfitness.com',
                'phone' => '+1 (555) 456-7890',
                'website' => 'https://urbanfitness.com',
                'description' => 'Modern fitness studio offering personalized training programs and wellness coaching.',
                'logo_path' => '',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'organization_id' => 1,
                'name' => 'Artisan Coffee Roasters',
                'email' => 'orders@artisancoffee.com',
                'phone' => '+1 (555) 321-0987',
                'website' => 'https://artisancoffee.com',
                'description' => 'Local coffee roastery specializing in single-origin beans and custom blends for cafes and restaurants.',
                'logo_path' => '',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'organization_id' => 1,
                'name' => 'Digital Marketing Pro',
                'email' => 'team@digitalmarketingpro.com',
                'phone' => '+1 (555) 654-3210',
                'website' => 'https://digitalmarketingpro.com',
                'description' => 'Full-service digital marketing agency helping small businesses grow their online presence.',
                'logo_path' => '',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'organization_id' => 1,
                'name' => 'Pet Care Clinic',
                'email' => 'appointments@petcareclinic.com',
                'phone' => '+1 (555) 789-0123',
                'website' => 'https://petcareclinic.com',
                'description' => 'Veterinary clinic providing comprehensive pet healthcare services with a focus on preventive care.',
                'logo_path' => '',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
        ];

        $table = $this->table('clients');
        $table->insert($data)->save();

        // Add some sample social accounts for these clients
        $socialAccountsData = [
            // TechStartup Solutions
            [
                'client_id' => 1,
                'platform' => 'facebook',
                'account_id' => 'techstartup_fb',
                'account_name' => 'TechStartup Solutions',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'client_id' => 1,
                'platform' => 'linkedin',
                'account_id' => 'techstartup_li',
                'account_name' => 'TechStartup Solutions',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'client_id' => 1,
                'platform' => 'twitter',
                'account_id' => 'techstartup_tw',
                'account_name' => '@TechStartupSol',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],

            // Green Earth Consulting
            [
                'client_id' => 2,
                'platform' => 'facebook',
                'account_id' => 'greenearth_fb',
                'account_name' => 'Green Earth Consulting',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'client_id' => 2,
                'platform' => 'instagram',
                'account_id' => 'greenearth_ig',
                'account_name' => '@greenearth_consulting',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],

            // Urban Fitness Studio
            [
                'client_id' => 3,
                'platform' => 'instagram',
                'account_id' => 'urbanfitness_ig',
                'account_name' => '@urbanfitness',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'client_id' => 3,
                'platform' => 'facebook',
                'account_id' => 'urbanfitness_fb',
                'account_name' => 'Urban Fitness Studio',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'client_id' => 3,
                'platform' => 'youtube',
                'account_id' => 'urbanfitness_yt',
                'account_name' => 'Urban Fitness Studio',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],

            // Artisan Coffee Roasters
            [
                'client_id' => 4,
                'platform' => 'instagram',
                'account_id' => 'artisancoffee_ig',
                'account_name' => '@artisancoffee',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
            [
                'client_id' => 4,
                'platform' => 'facebook',
                'account_id' => 'artisancoffee_fb',
                'account_name' => 'Artisan Coffee Roasters',
                'is_active' => true,
                'created' => date('Y-m-d H:i:s'),
                'updated' => date('Y-m-d H:i:s'),
            ],
        ];

        $socialTable = $this->table('social_accounts');
        $socialTable->insert($socialAccountsData)->save();
    }
}
