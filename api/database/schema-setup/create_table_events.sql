CREATE TABLE `eveesd_schema`.`events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `status` VARCHAR(20) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `source` VARCHAR(512) NOT NULL,
  `price` DECIMAL(5,2) NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `details_url` VARCHAR(512) NOT NULL,  
  `description` VARCHAR(255) NOT NULL,
  `thumbnail_url` VARCHAR(512) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP ,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);