-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 31, 2026 at 05:45 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `deped_leave_tracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `backlogs`
--

CREATE TABLE `backlogs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `school_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `leave_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `details` text DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `backlogs`
--

INSERT INTO `backlogs` (`id`, `user_id`, `school_id`, `employee_id`, `leave_id`, `action`, `details`, `is_archived`, `created_at`) VALUES
(1, NULL, NULL, NULL, NULL, 'USER_STATUS_UPDATED', 'Namtan Tipnaree: Deactivated', 0, '2026-03-12 03:52:50'),
(2, NULL, NULL, NULL, NULL, 'REGISTRATION_APPROVED', 'Ella Condalor as DATA_ENCODER', 0, '2026-03-12 12:28:42'),
(3, NULL, NULL, NULL, NULL, 'EMPLOYEE_CREATED', 'Loris Cute (non-teaching)', 0, '2026-03-16 03:28:31'),
(4, NULL, NULL, NULL, NULL, 'EMPLOYEE_CREATED', 'Becky Armstrong (teaching)', 0, '2026-03-16 03:39:52'),
(5, NULL, NULL, NULL, NULL, 'LEAVE_MONTHLY_CREDIT', 'Loris Cute — March 2026', 0, '2026-03-16 07:28:04'),
(10, NULL, NULL, NULL, NULL, 'REGISTRATION_APPROVED', 'Miu Taechamongkalapiwat as ADMIN', 0, '2026-03-18 05:57:25'),
(11, NULL, NULL, NULL, NULL, 'USER_ROLE_UPDATED', 'Miu Taechamongkalapiwat: ADMIN → SUPER_ADMIN', 0, '2026-03-18 05:57:39'),
(12, 17, NULL, NULL, NULL, 'EMPLOYEE_CREATED', 'asdad sadadsa (non-teaching)', 0, '2026-03-18 06:30:38'),
(13, 17, NULL, NULL, NULL, 'EMPLOYEE_CREATED', 'sadasd asdasd (non-teaching)', 0, '2026-03-18 06:32:47'),
(14, 17, NULL, NULL, NULL, 'EMPLOYEE_CREATED', 'Love Limpatiyakorn (teaching)', 0, '2026-03-18 06:39:44'),
(15, 17, NULL, NULL, NULL, 'REGISTRATION_APPROVED', 'Amir Perez as DATA_ENCODER', 0, '2026-03-19 01:38:17'),
(16, NULL, NULL, NULL, NULL, 'USER_CREATED', 'Bea Cortez as DATA_ENCODER', 0, '2026-03-19 01:56:43'),
(17, NULL, NULL, NULL, NULL, 'USER_CREATED', 'Amir Perez as DATA_ENCODER', 0, '2026-03-19 02:09:56'),
(37, 17, NULL, NULL, NULL, 'EMPLOYEE_CREATED', 'Taylor Swift (non-teaching)', 0, '2026-03-24 01:17:03'),
(38, NULL, NULL, NULL, NULL, 'USER_ROLE_UPDATED', 'Test Encoder: DATA_ENCODER → ADMIN', 0, '2026-03-24 04:07:54'),
(39, NULL, NULL, NULL, NULL, 'USER_ROLE_UPDATED', 'Test Encoder: ADMIN → DATA_ENCODER', 0, '2026-03-24 04:07:54'),
(40, NULL, NULL, NULL, NULL, 'USER_STATUS_UPDATED', 'Test Admin: Deactivated', 0, '2026-03-24 04:07:55'),
(41, NULL, NULL, NULL, NULL, 'USER_STATUS_UPDATED', 'Test Admin: Activated', 0, '2026-03-24 04:07:55'),
(42, NULL, NULL, NULL, NULL, 'USER_CREATED', 'Tmp Encoder as DATA_ENCODER', 0, '2026-03-24 04:07:55'),
(43, NULL, NULL, NULL, NULL, 'USER_DELETED', 'Tmp Encoder (tmp-encoder-1774325275075@example.test)', 0, '2026-03-24 04:07:55'),
(44, NULL, NULL, NULL, NULL, 'USER_CREATED', 'Tmp Encoder as DATA_ENCODER', 0, '2026-03-24 04:12:22'),
(45, NULL, NULL, NULL, NULL, 'USER_DELETED', 'Tmp Encoder (tmp-created-1774325542013@example.test)', 0, '2026-03-24 04:12:22'),
(46, NULL, NULL, NULL, NULL, 'USER_PASSWORD_RESET', 'Password reset for Test Encoder', 0, '2026-03-24 04:49:54'),
(47, NULL, NULL, NULL, NULL, 'REGISTRATION_APPROVED', 'Reg User as DATA_ENCODER', 0, '2026-03-24 04:49:54'),
(48, NULL, NULL, NULL, NULL, 'REGISTRATION_APPROVED', 'Love Pattranite as DATA_ENCODER', 0, '2026-03-24 04:54:52'),
(49, NULL, NULL, NULL, NULL, 'REGISTRATION_APPROVED', 'Alexis Torrefiel as DATA_ENCODER', 0, '2026-03-24 04:58:50'),
(50, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Adrian Ong (teaching)', 0, '2026-03-25 01:53:45'),
(51, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Arnold Chua (teaching)', 0, '2026-03-25 01:56:48'),
(52, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Arvin Salazar (teaching)', 0, '2026-03-25 01:58:28'),
(53, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Belinda Tolentino (non-teaching)', 0, '2026-03-25 02:00:44'),
(54, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Adrian Ong (teaching)', 0, '2026-03-25 02:04:14'),
(55, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Arnold Chua (teaching)', 0, '2026-03-25 02:10:13'),
(56, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Arvin Salazar (teaching)', 0, '2026-03-25 02:10:54'),
(57, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Adrian Ong (teaching)', 0, '2026-03-25 02:12:42'),
(58, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Adrian Ong (teaching)', 0, '2026-03-25 02:12:49'),
(59, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Alvin Morales (non-teaching)', 0, '2026-03-25 02:13:15'),
(60, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Alvin Morales (non-teaching)', 0, '2026-03-25 02:13:22'),
(61, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Adrian Ong (teaching)', 0, '2026-03-25 02:26:17'),
(62, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Aira Nicole Concepcion (teaching)', 0, '2026-03-25 02:26:44'),
(63, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Alfred Go (teaching)', 0, '2026-03-25 02:26:50'),
(64, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Allan Santiago (teaching)', 0, '2026-03-25 02:26:54'),
(65, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Adrian Ong (teaching)', 0, '2026-03-25 02:27:04'),
(66, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Aira Nicole Concepcion (teaching)', 0, '2026-03-25 02:27:05'),
(67, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Alfred Go (teaching)', 0, '2026-03-25 02:27:11'),
(68, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Allan Santiago (teaching)', 0, '2026-03-25 02:27:11'),
(69, 17, NULL, NULL, NULL, 'EMPLOYEE_UNARCHIVED', 'Belinda Tolentino (non-teaching)', 0, '2026-03-25 02:27:11'),
(70, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Adrian Ong', 0, '2026-03-25 02:43:10'),
(71, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Adrian Ong', 0, '2026-03-25 02:43:11'),
(72, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Adrian Ong', 0, '2026-03-25 02:46:51'),
(73, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Adrian Ong', 0, '2026-03-25 02:47:01'),
(74, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Adrian Ong', 0, '2026-03-25 02:47:02'),
(75, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Adrian Ong', 0, '2026-03-25 02:47:14'),
(76, 17, NULL, NULL, NULL, 'EMPLOYEE_ARCHIVED', 'Adrian Ong (teaching)', 0, '2026-03-25 02:50:29'),
(77, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:50:45'),
(78, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:50:46'),
(79, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:53:14'),
(80, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:53:15'),
(81, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:57:14'),
(82, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:57:15'),
(83, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:58:23'),
(84, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:58:24'),
(85, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:58:41'),
(86, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 02:58:42'),
(87, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:06:37'),
(88, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:06:38'),
(89, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:06:43'),
(90, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:06:45'),
(91, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:09:23'),
(92, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:09:23'),
(93, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:11:13'),
(94, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:11:14'),
(95, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:11:16'),
(96, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:11:16'),
(97, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:14:02'),
(98, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:14:03'),
(99, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:15:46'),
(100, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:15:57'),
(101, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:20:57'),
(102, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:23:53'),
(103, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:28:17'),
(104, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:28:24'),
(105, 17, NULL, NULL, NULL, 'EMPLOYEE_CREATED', 'Juan Two Three (teaching)', 0, '2026-03-25 03:40:07'),
(106, 28, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:43:07'),
(107, 28, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:43:10'),
(108, 28, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Alfred Go', 0, '2026-03-25 03:44:27'),
(109, 28, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Alfred Go', 0, '2026-03-25 03:44:34'),
(110, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:58:20'),
(111, 17, NULL, NULL, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Aira Nicole Concepcion', 0, '2026-03-25 03:58:31'),
(115, 17, NULL, NULL, NULL, 'LEAVE_DELETED', 'Feb 11 to Feb 13 — Becky Armstrong', 0, '2026-03-25 06:43:00'),
(116, 17, NULL, NULL, NULL, 'LEAVE_DELETED', 'March 2026 — Carla Kho', 0, '2026-03-25 06:43:30'),
(117, 17, NULL, NULL, NULL, 'LEAVE_DELETED', 'qweqweqw — Aira Nicole Concepcion', 0, '2026-03-25 06:53:54'),
(118, 17, 45, 156, NULL, 'EMPLOYEE_CREATED', 'Juan Dela Cruz (non-teaching)', 0, '2026-03-25 07:41:04'),
(119, 17, 77, 207, NULL, 'EMPLOYEE_CREATED', 'Becky Armstrong (non-teaching)', 0, '2026-03-25 07:49:22'),
(120, 17, NULL, 207, 318, 'LEAVE_CREATED', 'dqwqweqwe — Monetization', 0, '2026-03-25 08:11:26'),
(121, 17, NULL, 207, NULL, 'LEAVE_DELETED', 'March 2026 — Becky Armstrong', 0, '2026-03-25 08:36:40'),
(122, 17, 32, 193, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Allan Pascual', 0, '2026-03-25 08:40:32'),
(123, 17, 44, 180, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Ana Mendoza', 0, '2026-03-25 08:40:42'),
(124, 17, 44, 180, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Ana Mendoza', 0, '2026-03-25 08:40:47'),
(125, 17, 32, 193, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Allan Pascual', 0, '2026-03-25 08:40:51'),
(126, 26, NULL, NULL, NULL, 'REGISTRATION_APPROVED', 'Raymond Bautista as ADMIN', 0, '2026-03-26 01:10:59'),
(127, 30, 57, NULL, NULL, 'USER_CREATED', 'Bea Patrice as DATA_ENCODER', 0, '2026-03-26 02:20:45'),
(128, 30, 57, NULL, NULL, 'USER_CREATED', 'Alexis Torrefiel as DATA_ENCODER', 0, '2026-03-26 02:27:13'),
(129, 17, NULL, NULL, NULL, 'REGISTRATION_APPROVED', 'Namtan Tipnaree as DATA_ENCODER', 0, '2026-03-26 02:28:21'),
(130, 33, 69, 208, NULL, 'EMPLOYEE_CREATED', 'Raymond Bautista (non-teaching)', 0, '2026-03-26 02:47:28'),
(131, 30, NULL, NULL, NULL, 'REGISTRATION_REJECTED', 'Hanz Presas', 0, '2026-03-26 03:10:13'),
(132, 17, NULL, NULL, NULL, 'SCHOOL_CREATED', 'Amir Perez Institute of Philippines (AMIRPEREZ)', 0, '2026-03-26 05:05:40'),
(134, 17, NULL, NULL, NULL, 'SCHOOL_CREATED', 'Amir Perez (AMIRPEREZ)', 0, '2026-03-26 05:07:38'),
(136, 17, NULL, NULL, NULL, 'LEAVE_PARTICULAR_CREATED', 'Raymond', 0, '2026-03-26 05:08:34'),
(137, 17, NULL, NULL, NULL, 'LEAVE_PARTICULAR_DELETED', 'Raymond', 0, '2026-03-26 05:08:42'),
(138, 17, NULL, 207, 348, 'LEAVE_CREATED', 'df — Leave Credit', 0, '2026-03-26 05:10:07'),
(139, 17, NULL, NULL, NULL, 'SCHOOL_CREATED', 'Amir Perez (AMIRPEREZ)', 0, '2026-03-26 05:10:33'),
(140, 17, NULL, NULL, NULL, 'SCHOOL_DELETED', 'Amir Perez (AMIRPEREZ)', 0, '2026-03-26 05:10:47'),
(141, 30, 57, 209, NULL, 'EMPLOYEE_CREATED', 'Erica Doblon (non-teaching)', 0, '2026-03-26 05:12:23'),
(142, 30, NULL, 209, 349, 'LEAVE_CREATED', 'asdasd — Leave Credit', 0, '2026-03-26 05:12:38'),
(143, 30, 57, 209, NULL, 'EMPLOYEE_MARKED_ON_LEAVE', 'Erica Doblon', 0, '2026-03-26 05:12:42'),
(144, 30, 57, 209, NULL, 'EMPLOYEE_MARKED_AVAILABLE', 'Erica Doblon', 0, '2026-03-26 05:12:44'),
(145, 17, NULL, NULL, NULL, 'SCHOOL_CREATED', 'Amir (AMIR)', 0, '2026-03-26 05:13:38'),
(146, 17, NULL, NULL, NULL, 'SCHOOL_DELETED', 'Amir (AMIR)', 0, '2026-03-26 05:14:10'),
(147, 17, NULL, NULL, NULL, 'LEAVE_PARTICULAR_CREATED', 'Raymond', 0, '2026-03-26 05:14:23'),
(148, 17, NULL, NULL, NULL, 'LEAVE_PARTICULAR_DELETED', 'Raymond', 0, '2026-03-26 05:14:53'),
(149, 17, NULL, NULL, NULL, 'SCHOOL_CREATED', 'School Test (SCHOOLTES)', 0, '2026-03-26 05:16:20'),
(150, 17, NULL, NULL, NULL, 'LEAVE_PARTICULAR_CREATED', 'Particulars Test', 0, '2026-03-26 05:16:30'),
(151, 17, NULL, NULL, NULL, 'LEAVE_PARTICULAR_DELETED', 'Particulars Test', 0, '2026-03-26 05:16:58'),
(152, 17, NULL, NULL, NULL, 'SCHOOL_DELETED', 'School Test (SCHOOLTES)', 0, '2026-03-26 05:17:14'),
(153, 17, NULL, NULL, NULL, 'SCHOOL_CREATED', 'Alexis (ALEXIS)', 0, '2026-03-26 05:18:45'),
(154, 17, NULL, NULL, NULL, 'SCHOOL_DELETED', 'Alexis (ALEXIS)', 0, '2026-03-26 05:20:32'),
(155, 17, NULL, NULL, NULL, 'SCHOOL_CREATED', 'Amir (AMIR)', 0, '2026-03-26 05:20:41'),
(156, 17, NULL, NULL, NULL, 'SCHOOL_DELETED', 'Amir (AMIR)', 0, '2026-03-26 05:20:48'),
(157, 17, NULL, NULL, NULL, 'LEAVE_PARTICULAR_CREATED', 'raymond', 0, '2026-03-26 05:29:32'),
(158, 17, NULL, NULL, NULL, 'LEAVE_PARTICULAR_DELETED', 'raymond', 0, '2026-03-26 05:30:05'),
(159, 17, NULL, NULL, NULL, 'SCHOOL_CREATED', 'Amir (AMIR)', 0, '2026-03-26 05:30:16'),
(160, 17, NULL, NULL, NULL, 'SCHOOL_DELETED', 'Amir (AMIR)', 0, '2026-03-26 05:30:26'),
(161, 17, 32, 193, NULL, 'EMPLOYEE_ARCHIVED', 'Allan Pascual (teaching)', 0, '2026-03-26 05:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `first_name` varchar(75) NOT NULL,
  `last_name` varchar(75) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `place_of_birth` varchar(255) DEFAULT NULL,
  `civil_status` varchar(50) DEFAULT NULL,
  `civil_status_id` int(11) DEFAULT NULL,
  `sex` varchar(20) DEFAULT NULL,
  `sex_id` int(11) DEFAULT NULL,
  `employee_type` enum('teaching','non-teaching','teaching-related') NOT NULL,
  `school_id` int(11) NOT NULL,
  `retirable` enum('Yes','No','Mandatory Retirement') DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `archived_at` datetime DEFAULT NULL,
  `archived_by` int(11) DEFAULT NULL,
  `archived_reason` varchar(500) DEFAULT NULL,
  `on_leave` tinyint(1) NOT NULL DEFAULT 0,
  `on_leave_from` date DEFAULT NULL,
  `on_leave_until` date DEFAULT NULL,
  `on_leave_reason` varchar(500) DEFAULT NULL,
  `leave_status_updated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `first_name`, `last_name`, `email`, `employee_type`, `school_id`, `is_archived`, `archived_at`, `archived_by`, `on_leave`, `on_leave_from`, `on_leave_until`, `on_leave_reason`, `leave_status_updated_at`, `created_at`) VALUES
(156, 'Juan', 'Dela Cruz', 'juan23@email.com', 'non-teaching', 45, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:41:04'),
(157, 'Namtan', 'Tipnaree', 'namtan.tipnaree01@test.com', 'teaching', 21, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(158, 'Lorena', 'Schuett', 'lorena.schuett02@test.com', 'non-teaching', 22, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(159, 'Freen', 'Sarocha', 'freen.sarocha03@test.com', 'teaching', 23, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(160, 'Mim', 'Panthita', 'mim.panthita04@test.com', 'non-teaching', 24, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(161, 'Mable', 'Siriwalee', 'mable.siriwalee05@test.com', 'teaching', 25, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(162, 'Pangjie', 'Paphavarin', 'pangjie.paphavarin06@test.com', 'non-teaching', 26, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(163, 'Orm', 'Kornnaphat', 'orm.kornnaphat07@test.com', 'teaching', 27, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(164, 'Lingling', 'Kwong', 'lingling.kwong08@test.com', 'non-teaching', 28, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(165, 'Emi', 'Thasorn', 'emi.thasorn09@test.com', 'teaching', 29, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(166, 'Bonnie', 'Patthrapus', 'bonnie.patthrapus10@test.com', 'non-teaching', 30, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(167, 'Film', 'Rachanun', 'film.rachanun11@test.com', 'teaching', 31, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(168, 'Enjoy', 'Thidarut', 'enjoy.thidarut12@test.com', 'non-teaching', 32, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(169, 'June', 'Nannirin', 'june.nannirin13@test.com', 'teaching', 33, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(170, 'Ginny', 'Natnicha', 'ginny.natnicha14@test.com', 'non-teaching', 34, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(171, 'Shelly', 'Benda', 'shelly.benda15@test.com', 'teaching', 35, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(172, 'Faye', 'Peraya', 'faye.peraya16@test.com', 'non-teaching', 36, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(173, 'Tangkwa', 'Phinyanech', 'tangkwa.phinyanech17@test.com', 'teaching', 37, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(174, 'Sonya', 'Saran', 'sonya.saran18@test.com', 'non-teaching', 38, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(175, 'Lookmhee', 'Punyapat', 'lookmhee.punyapat19@test.com', 'teaching', 39, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(176, 'Jingjing', 'Yu', 'jingjing.yu20@test.com', 'non-teaching', 40, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(177, 'Juan', 'Dela Cruz', 'juan.delacruz21@test.com', 'teaching', 41, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(178, 'Maria', 'Santos', 'maria.santos22@test.com', 'non-teaching', 42, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(179, 'Jose', 'Reyes', 'jose.reyes23@test.com', 'teaching', 43, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(180, 'Ana', 'Mendoza', 'ana.mendoza24@test.com', 'non-teaching', 44, 0, NULL, NULL, 0, NULL, NULL, NULL, '2026-03-25 16:40:47', '2026-03-25 07:48:03'),
(181, 'Paolo', 'Garcia', 'paolo.garcia25@test.com', 'teaching', 45, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(182, 'Liza', 'Fernandez', 'liza.fernandez26@test.com', 'non-teaching', 21, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(183, 'Mark', 'Ramos', 'mark.ramos27@test.com', 'teaching', 22, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(184, 'Joy', 'Torres', 'joy.torres28@test.com', 'non-teaching', 23, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(185, 'Carlo', 'Navarro', 'carlo.navarro29@test.com', 'teaching', 24, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(186, 'Jenny', 'Aquino', 'jenny.aquino30@test.com', 'non-teaching', 25, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(187, 'Miguel', 'Castillo', 'miguel.castillo31@test.com', 'teaching', 26, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(188, 'Angela', 'Flores', 'angela.flores32@test.com', 'non-teaching', 27, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(189, 'Rico', 'Bautista', 'rico.bautista33@test.com', 'teaching', 28, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(190, 'Sheila', 'Soriano', 'sheila.soriano34@test.com', 'non-teaching', 29, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(191, 'Dennis', 'Villanueva', 'dennis.villanueva35@test.com', 'teaching', 30, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(192, 'Karen', 'Domingo', 'karen.domingo36@test.com', 'non-teaching', 31, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(193, 'Allan', 'Pascual', 'allan.pascual37@test.com', 'teaching', 32, 1, '2026-03-26 13:59:05', 17, 0, NULL, NULL, NULL, '2026-03-25 16:40:51', '2026-03-25 07:48:03'),
(194, 'Grace', 'Salazar', 'grace.salazar38@test.com', 'non-teaching', 33, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(195, 'Leo', 'Mercado', 'leo.mercado39@test.com', 'teaching', 34, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(196, 'Irene', 'Morales', 'irene.morales40@test.com', 'non-teaching', 35, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(197, 'Victor', 'Cabrera', 'victor.cabrera41@test.com', 'teaching', 36, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(198, 'Marlene', 'Alvarez', 'marlene.alvarez42@test.com', 'non-teaching', 37, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(199, 'Joel', 'Espino', 'joel.espino43@test.com', 'teaching', 38, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(200, 'Nina', 'Tolentino', 'nina.tolentino44@test.com', 'non-teaching', 39, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(201, 'Oscar', 'Manalo', 'oscar.manalo45@test.com', 'teaching', 40, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(202, 'Teresa', 'Samson', 'teresa.samson46@test.com', 'non-teaching', 41, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(203, 'Ramon', 'Padilla', 'ramon.padilla47@test.com', 'teaching', 42, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(204, 'Cynthia', 'Nolasco', 'cynthia.nolasco48@test.com', 'non-teaching', 43, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(205, 'Edgar', 'Eusebio', 'edgar.eusebio49@test.com', 'teaching', 44, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(206, 'Lorna', 'De Guzman', 'lorna.deguzman50@test.com', 'non-teaching', 45, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:48:03'),
(207, 'Becky', 'Armstrong', 'becky@email.com', 'non-teaching', 77, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-25 07:49:22'),
(208, 'Raymond', 'Bautista', 'bau@email.com', 'non-teaching', 69, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-03-26 02:47:28'),
(209, 'Erica', 'Doblon', 'erica@email.com', 'non-teaching', 57, 0, NULL, NULL, 0, NULL, NULL, NULL, '2026-03-26 13:12:44', '2026-03-26 05:12:23');

-- --------------------------------------------------------

--
-- Table structure for table `leaves`
--

CREATE TABLE `leaves` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `period_of_leave` text NOT NULL,
  `entry_kind` enum('MANUAL','MONTHLY_CREDIT') NOT NULL DEFAULT 'MANUAL',
  `particulars` enum('Adoption Leave','Compensatory Paid Leave','Forced Leave (Disapproved)','Forced Leave','Late/Undertime','Leave Credit','Maternity Leave','Monetization','Paternity Leave','Rehabilitation Leave','Special Emergency Leave','Sick Leave','Solo Parent','Special Privilege Leave','Special Leave for Women','Study Leave','Terminal Leave','VAWC Leave','Vacation Leave','Balance Forwarded','Service Credit','Training/Seminar','Brigada Eskwela','Early Registration/Enrollment','Election','Remediation/Enrichment Classes/NLC','Checking of Forms','Wellness Leave','Others') DEFAULT NULL,
  `earned_vl` decimal(10,2) DEFAULT 0.00,
  `abs_with_pay_vl` decimal(10,2) DEFAULT 0.00,
  `abs_without_pay_vl` decimal(10,2) DEFAULT 0.00,
  `bal_vl` decimal(10,2) DEFAULT 0.00,
  `earned_sl` decimal(10,2) DEFAULT 0.00,
  `abs_with_pay_sl` decimal(10,2) DEFAULT 0.00,
  `abs_without_pay_sl` decimal(10,2) DEFAULT 0.00,
  `bal_sl` decimal(10,2) DEFAULT 0.00,
  `date_of_action` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leaves`
--

INSERT INTO `leaves` (`id`, `employee_id`, `period_of_leave`, `entry_kind`, `particulars`, `earned_vl`, `abs_with_pay_vl`, `abs_without_pay_vl`, `bal_vl`, `earned_sl`, `abs_with_pay_sl`, `abs_without_pay_sl`, `bal_sl`, `date_of_action`, `created_at`) VALUES
(291, 156, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(292, 158, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(293, 160, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(294, 162, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(295, 164, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(296, 166, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(297, 168, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(298, 170, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(299, 172, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(300, 174, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(301, 176, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(302, 178, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(303, 180, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(304, 182, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:14'),
(305, 184, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(306, 186, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(307, 188, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(308, 190, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(309, 192, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(310, 194, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(311, 196, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(312, 198, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(313, 200, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(314, 202, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(315, 204, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(316, 206, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-25', '2026-03-25 07:57:15'),
(318, 207, 'dqwqweqwe', 'MANUAL', 'Monetization', 0.00, 1.25, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-25', '2026-03-25 08:11:26'),
(319, 207, 'January 2 to January 2, 2026', 'MANUAL', 'Balance Forwarded', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-01-02', '2026-03-25 08:36:22'),
(320, 207, 'January 3 to January 3, 2026', 'MANUAL', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 0.00, 0.00, 0.00, 0.00, '2026-01-03', '2026-03-25 08:36:22'),
(321, 207, 'January 6 to January 6, 2026', 'MANUAL', 'Vacation Leave', 0.00, 1.00, 0.00, 0.25, 0.00, 0.00, 0.00, 0.00, '2026-01-06', '2026-03-25 08:36:22'),
(322, 207, 'January 8 to January 8, 2026', 'MANUAL', 'Sick Leave', 0.00, 0.00, 0.00, 0.25, 0.00, 1.00, 0.00, 0.00, '2026-01-08', '2026-03-25 08:36:22'),
(323, 207, 'January 10 to January 10, 2026', 'MANUAL', 'Late/Undertime', 0.00, 0.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-01-10', '2026-03-25 08:36:22'),
(324, 207, 'January 13 to January 13, 2026', 'MANUAL', 'Wellness Leave', 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-01-13', '2026-03-25 08:36:22'),
(325, 207, 'January 15 to January 15, 2026', 'MANUAL', 'Training/Seminar', 0.50, 0.00, 0.00, 0.50, 0.00, 0.00, 0.00, 0.00, '2026-01-15', '2026-03-25 08:36:22'),
(326, 207, 'January 17 to January 17, 2026', 'MANUAL', 'Service Credit', 0.50, 0.00, 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, '2026-01-17', '2026-03-25 08:36:22'),
(327, 207, 'January 20 to January 20, 2026', 'MANUAL', 'Special Privilege Leave', 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-01-20', '2026-03-25 08:36:22'),
(328, 207, 'January 22 to January 22, 2026', 'MANUAL', 'Others', 0.00, 0.50, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-01-22', '2026-03-25 08:36:22'),
(329, 207, 'January 24 to January 24, 2026', 'MANUAL', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 0.00, 0.00, 0.00, 0.00, '2026-01-24', '2026-03-25 08:36:22'),
(330, 207, 'January 27 to January 27, 2026', 'MANUAL', 'Special Emergency Leave', 0.00, 1.00, 0.00, 0.25, 0.00, 0.00, 0.00, 0.00, '2026-01-27', '2026-03-25 08:36:22'),
(331, 207, 'January 29 to January 29, 2026', 'MANUAL', 'Checking of Forms', 0.50, 0.00, 0.00, 0.75, 0.00, 0.00, 0.00, 0.00, '2026-01-29', '2026-03-25 08:36:22'),
(332, 207, 'February 1 to February 1, 2026', 'MANUAL', 'Brigada Eskwela', 0.50, 0.00, 0.00, 1.25, 0.00, 0.00, 0.00, 0.00, '2026-02-01', '2026-03-25 08:36:22'),
(333, 207, 'February 3 to February 3, 2026', 'MANUAL', 'Early Registration/Enrollment', 0.50, 0.00, 0.00, 1.75, 0.00, 0.00, 0.00, 0.00, '2026-02-03', '2026-03-25 08:36:22'),
(334, 207, 'February 5 to February 5, 2026', 'MANUAL', 'Election', 0.50, 0.00, 0.00, 2.25, 0.00, 0.00, 0.00, 0.00, '2026-02-05', '2026-03-25 08:36:22'),
(335, 207, 'February 7 to February 7, 2026', 'MANUAL', 'Remediation/Enrichment Classes/NLC', 0.50, 0.00, 0.00, 2.75, 0.00, 0.00, 0.00, 0.00, '2026-02-07', '2026-03-25 08:36:22'),
(336, 207, 'February 10 to February 10, 2026', 'MANUAL', 'Vacation Leave', 0.00, 1.00, 0.00, 1.75, 0.00, 0.00, 0.00, 0.00, '2026-02-10', '2026-03-25 08:36:22'),
(337, 207, 'February 12 to February 12, 2026', 'MANUAL', 'Sick Leave', 0.00, 0.00, 0.00, 1.75, 0.00, 1.00, 0.00, 0.00, '2026-02-12', '2026-03-25 08:36:22'),
(338, 207, 'February 14 to February 14, 2026', 'MANUAL', 'Late/Undertime', 0.00, 0.50, 0.00, 1.25, 0.00, 0.00, 0.00, 0.00, '2026-02-14', '2026-03-25 08:36:22'),
(339, 207, 'February 16 to February 16, 2026', 'MANUAL', 'Forced Leave', 0.00, 1.00, 0.00, 0.25, 0.00, 0.00, 0.00, 0.00, '2026-02-16', '2026-03-25 08:36:22'),
(340, 207, 'February 18 to February 18, 2026', 'MANUAL', 'Forced Leave (Disapproved)', 0.00, 0.00, 1.00, 0.25, 0.00, 0.00, 0.00, 0.00, '2026-02-18', '2026-03-25 08:36:22'),
(341, 207, 'February 20 to February 20, 2026', 'MANUAL', 'Compensatory Paid Leave', 0.50, 0.00, 0.00, 0.75, 0.00, 0.00, 0.00, 0.00, '2026-02-20', '2026-03-25 08:36:22'),
(342, 207, 'February 22 to February 22, 2026', 'MANUAL', 'Service Credit', 0.50, 0.00, 0.00, 1.25, 0.00, 0.00, 0.00, 0.00, '2026-02-22', '2026-03-25 08:36:22'),
(343, 207, 'February 24 to February 24, 2026', 'MANUAL', 'Wellness Leave', 0.00, 1.00, 0.00, 0.25, 0.00, 0.00, 0.00, 0.00, '2026-02-24', '2026-03-25 08:36:22'),
(344, 207, 'February 26 to February 26, 2026', 'MANUAL', 'Special Leave for Women', 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-02-26', '2026-03-25 08:36:22'),
(345, 207, 'February 28 to February 28, 2026', 'MANUAL', 'Solo Parent', 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-02-28', '2026-03-25 08:36:22'),
(346, 207, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-26', '2026-03-26 00:21:03'),
(347, 208, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 1.25, 0.00, 0.00, 1.25, '2026-03-26', '2026-03-26 03:37:47'),
(348, 207, 'df', 'MANUAL', 'Leave Credit', 1.25, 0.00, 0.00, 2.50, 0.00, 0.00, 0.00, 1.25, '2026-03-26', '2026-03-26 05:10:07'),
(349, 209, 'asdasd', 'MANUAL', 'Leave Credit', 1.25, 0.00, 0.00, 1.25, 0.00, 0.00, 0.00, 0.00, '2026-03-26', '2026-03-26 05:12:38'),
(350, 209, 'March 2026', 'MONTHLY_CREDIT', 'Leave Credit', 1.25, 0.00, 0.00, 2.50, 1.25, 0.00, 0.00, 1.25, '2026-03-30', '2026-03-30 23:57:11');

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `identifier` varchar(320) NOT NULL,
  `email` varchar(255) NOT NULL,
  `source_ip` varchar(64) NOT NULL,
  `failed_attempts` int(11) NOT NULL DEFAULT 0,
  `last_failed_at` datetime DEFAULT NULL,
  `locked_until` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_attempts`
--

INSERT INTO `login_attempts` (`identifier`, `email`, `source_ip`, `failed_attempts`, `last_failed_at`, `locked_until`, `created_at`, `updated_at`) VALUES
('amir@email.com|::1', 'amir@email.com', '::1', 1, '2026-03-26 10:27:30', NULL, '2026-03-26 02:27:30', '2026-03-26 02:27:30'),
('ray@email.com|::1', 'ray@email.com', '::1', 1, '2026-03-26 09:12:17', NULL, '2026-03-26 01:12:17', '2026-03-26 01:12:17'),
('test@example.com|::1', 'test@example.com', '::1', 1, '2026-03-25 15:15:34', NULL, '2026-03-25 07:15:34', '2026-03-25 07:15:34');

-- --------------------------------------------------------

--
-- Table structure for table `registration_requests`
--

CREATE TABLE `registration_requests` (
  `id` int(11) NOT NULL,
  `first_name` varchar(75) NOT NULL,
  `last_name` varchar(75) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `school_name` varchar(255) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `requested_role` enum('ADMIN','DATA_ENCODER') DEFAULT NULL,
  `approved_role` enum('ADMIN','DATA_ENCODER') DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registration_requests`
--

INSERT INTO `registration_requests` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `school_name`, `status`, `requested_role`, `approved_role`, `reviewed_by`, `reviewed_at`, `rejection_reason`, `created_at`) VALUES
(6, 'Shania', 'Condalor', 'shania@email.com', '$2a$10$XCCvruko7.qv1d9CJfSG0eI3FP1bnuaJXS8VU0BiIK8WYoFKntSuC', 'SJDMNHS', 'APPROVED', NULL, 'ADMIN', NULL, '2026-03-11 03:28:24', NULL, '2026-03-10 08:03:26'),
(7, 'Bea', 'Cortez', 'bea@email.com', '$2a$10$.e4mYQHq67gjpt6boIQPTORRIJTsDOBLhq0t2FeLRgU.gs5CU7eAS', 'SJDMNHS', 'APPROVED', NULL, 'DATA_ENCODER', NULL, '2026-03-11 06:49:07', NULL, '2026-03-10 08:04:59'),
(8, 'Hanz', 'Presa', 'hans@email.com', '$2a$10$7.dyxY03LckfcVdMDikwU.CsBy3poXioZ/NO.1X/U.fKvV.OgI94S', 'SJDMNHS', 'REJECTED', NULL, NULL, NULL, '2026-03-11 03:26:50', NULL, '2026-03-10 08:33:58'),
(10, 'Loris', 'Condalor', 'loris@email.com', '$2a$10$ZrtSIWJ6BvlOuDDlc6iMB.4tcK3BG4afZTcM4QH4h6oMQ78atyUHO', 'SJDMNHS', 'APPROVED', NULL, 'DATA_ENCODER', NULL, '2026-03-11 06:50:21', NULL, '2026-03-11 06:50:01'),
(11, 'Namtan', 'Tipnaree', 'namtan@email.com', '$2a$10$ISorRaDyQMk9hjTFomzzSuZd8pWsk7JLBqFYOHVrEmoYZwTTClDoO', 'SJDMNHS', 'APPROVED', NULL, 'DATA_ENCODER', NULL, '2026-03-11 07:01:52', NULL, '2026-03-11 07:01:34'),
(12, 'Miu', 'Taechamongkalapiwat', 'shaniacondalor@gmail.com', '$2a$10$buxg6JkTdDlx9GchGia1I.l4mB2G1.LJJH2RKxTB8KcVC9ipxwG7G', 'SJDMNHS', 'APPROVED', NULL, 'DATA_ENCODER', NULL, '2026-03-12 00:11:26', NULL, '2026-03-11 08:22:04'),
(13, 'Mark', 'Condalor', 'mark@email.com', '$2a$10$cRQDePOtIZiK22El6tkYg.EyaELBDSLGa1hKclMzB/MoMtc16zg4e', 'CSJDMNSHS', 'APPROVED', NULL, 'ADMIN', NULL, '2026-03-11 12:30:07', NULL, '2026-03-11 12:28:55'),
(14, 'Loris', 'Condalor', 'vermeil2004@gmail.com', '$2a$10$l8sXQkO3Xq/Mr7LGPUqKfu.rW26nEQoEfG6qVNT0w5dDyT2AfaU1y', 'SJDMNHS', 'REJECTED', NULL, NULL, NULL, '2026-03-12 00:10:21', 'jkshdhagfh', '2026-03-12 00:09:07'),
(20, 'Shania', 'Condalor', 'beru.woo@gmail.com', '$2a$10$qXCwhDk2P9BwAdy4LDj8quci8GM.2y2qdjpLbOOtAbXP1skg0lg.O', 'SJDMNHS', 'PENDING', NULL, NULL, NULL, NULL, NULL, '2026-03-12 01:50:21'),
(21, 'Shania', 'Condalor', 'gyatpookie1@gmail.com', '$2a$10$fAp8uNBOLBkoqB.J96vtG./P4/zJs2o4K2YzTKx6D4EkTPfgtG4vS', 'CSJDMNSHS', 'APPROVED', NULL, 'DATA_ENCODER', NULL, '2026-03-12 01:51:46', NULL, '2026-03-12 01:51:12'),
(22, 'Ella', 'Condalor', 'ellacondalor08271977@gmail.com', '$2a$10$KX/DAdfeoWpO.d.KYPPwreXlyfNaAsDPWF1JYFty2kK2gGpKpSPTC', 'MNHS', 'APPROVED', NULL, 'DATA_ENCODER', NULL, '2026-03-12 12:28:42', NULL, '2026-03-12 12:27:52'),
(23, 'Miu', 'Taechamongkalapiwat', 'shaniacondalor@gmail.com', '$2a$10$ES3rOu1co7Bz4AZIWyVb9O2ezVX.gDt6WhG12LCpjRu5yysQRhuF2', 'SJDMNHS', 'APPROVED', NULL, 'ADMIN', NULL, '2026-03-18 05:57:25', NULL, '2026-03-18 05:56:52'),
(24, 'Amir', 'Perez', 'amir@email.com', '$2a$10$r7E54.DmrGcuuFW2caamNe//HsfGLkSiLKHyw/VRd0mzn3hu/BQ4O', 'CSJDMNSHS', 'APPROVED', 'DATA_ENCODER', 'DATA_ENCODER', 17, '2026-03-19 01:38:17', NULL, '2026-03-19 01:38:17'),
(25, 'Alexis', 'Torrefiel', 'alexis@email.com', '$2a$10$qA54MRv3DvL9Z9ZA6DdDA.32LnoyyRCjfmZgBS8QKdi5fpR6ToiMC', 'CSJDMNSHS', 'APPROVED', 'DATA_ENCODER', 'DATA_ENCODER', NULL, '2026-03-24 04:58:50', NULL, '2026-03-19 01:50:17'),
(26, 'Love', 'Pattranite', 'love@email.com', '$2a$10$vy.TYkcRWUK1RwUDy92VquO/TXZSBf0/2WQw3PhqwnDZ1bNFuWIgy', 'CSJDMNSHS', 'APPROVED', NULL, 'DATA_ENCODER', NULL, '2026-03-24 04:54:52', NULL, '2026-03-19 02:02:25'),
(27, 'Reg', 'User', 'tmp-reg-1774327794423@example.test', '$2a$10$gp.NMtuVz16fRfauCYajmeoO.5knzLCifd.yAQphkypGguXFX87hm', 'Reg School', 'APPROVED', NULL, 'DATA_ENCODER', NULL, '2026-03-24 04:49:54', NULL, '2026-03-24 04:49:54'),
(28, 'Raymond', 'Bautista', 'raymond@email.com', '$2a$10$xTEQ2AQNvrph/amnURnSjOwmPwMs8cz5WoroWDOzz5m61UqaXhyta', 'City of San Jose del Monte National Science High School', 'APPROVED', NULL, 'ADMIN', 26, '2026-03-26 01:10:59', NULL, '2026-03-26 01:10:03'),
(29, 'Hanz', 'Presas', 'hanz@email.com', '$2a$10$a1OLHL4Ad4Y6Ia6qEAjbx.qtM.rHg/wISs/yhpPVabWLu6j2A37aK', 'City of San Jose del Monte National Science High School', 'REJECTED', NULL, NULL, 30, '2026-03-26 03:10:13', NULL, '2026-03-26 01:11:35'),
(30, 'Amir', 'Perez', 'perez@email.com', '$2a$10$5f3S4V0792E8hkSKHrhR0Of4jy4Sb5n6eSOqrPU.WqeRUgjNNrD6u', 'San Jose del Monte National High School', 'PENDING', NULL, NULL, NULL, NULL, NULL, '2026-03-26 01:13:38'),
(31, 'Namtan', 'Tipnaree', 'tipnaree@email.com', '$2a$10$jIjxRPj98gRi7AdUqRq5BOLSg4lxeQfjKDiC8dDVp.2yiPGrceCni', 'San Jose del Monte National High School', 'APPROVED', 'DATA_ENCODER', 'DATA_ENCODER', 17, '2026-03-26 02:28:21', NULL, '2026-03-26 02:28:20');

-- --------------------------------------------------------

--
-- Table structure for table `revoked_tokens`
--

CREATE TABLE `revoked_tokens` (
  `jti` varchar(64) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `revoked_tokens`
--

INSERT INTO `revoked_tokens` (`jti`, `user_id`, `expires_at`, `revoked_at`) VALUES
('c398fdf6-cc0d-4031-bddb-53f8a0d59db4', 17, '2026-04-01 08:24:42', '2026-03-31 02:04:48');

-- --------------------------------------------------------

--
-- Table structure for table `schools`
--

CREATE TABLE `schools` (
  `id` int(11) NOT NULL,
  `school_name` varchar(150) NOT NULL,
  `school_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schools`
--

INSERT INTO `schools` (`id`, `school_name`, `school_code`, `created_at`) VALUES
(21, 'Bagong Buhay E Elementary School', NULL, '2026-03-25 07:40:33'),
(22, 'Bagong Buhay G Elementary School', NULL, '2026-03-25 07:40:33'),
(23, 'Bagong Buhay I Elementary School (Lawang Pare)', NULL, '2026-03-25 07:40:33'),
(24, 'Benito Nieto Elementary School', NULL, '2026-03-25 07:40:33'),
(25, 'City of San Jose del Monte Indigenous People\'s Education School', NULL, '2026-03-25 07:40:33'),
(26, 'Daniel A. Avena Elementary School', NULL, '2026-03-25 07:40:33'),
(27, 'Francisco Homes Elementary School', NULL, '2026-03-25 07:40:33'),
(28, 'Gaya-Gaya Elementary School', NULL, '2026-03-25 07:40:33'),
(29, 'Goldenville Elementary School', NULL, '2026-03-25 07:40:33'),
(30, 'Graceville Elementary School', NULL, '2026-03-25 07:40:33'),
(31, 'Guijo Elementary School', NULL, '2026-03-25 07:40:33'),
(32, 'Gumaok Elementary School', NULL, '2026-03-25 07:40:33'),
(33, 'Heroesville Elementary School', NULL, '2026-03-25 07:40:33'),
(34, 'Kakawate Elementary School', NULL, '2026-03-25 07:40:33'),
(35, 'Kaypian Elementary School', NULL, '2026-03-25 07:40:33'),
(36, 'Marangal Elementary School', NULL, '2026-03-25 07:40:33'),
(37, 'Marangal Elementary School Annex', NULL, '2026-03-25 07:40:33'),
(38, 'Minuyan Elementary School', NULL, '2026-03-25 07:40:33'),
(39, 'Mulawin Elementary School', NULL, '2026-03-25 07:40:33'),
(40, 'Muzon (Pabahay 2000) Elementary School', NULL, '2026-03-25 07:40:33'),
(41, 'Paradise Farms Community School', NULL, '2026-03-25 07:40:33'),
(42, 'Partida Elementary School', NULL, '2026-03-25 07:40:33'),
(43, 'Ricafort Elementary School', NULL, '2026-03-25 07:40:33'),
(44, 'San Isidro Elementary School', NULL, '2026-03-25 07:40:33'),
(45, 'San Jose del Monte Central School', NULL, '2026-03-25 07:40:33'),
(46, 'San Jose del Monte Heights Elementary School', NULL, '2026-03-25 07:40:33'),
(47, 'San Manuel Elementary School', NULL, '2026-03-25 07:40:33'),
(48, 'San Martin (BBC) Elementary School', NULL, '2026-03-25 07:40:33'),
(49, 'San Rafael (BBH) Elementary School', NULL, '2026-03-25 07:40:33'),
(50, 'San Roque Elementary School', NULL, '2026-03-25 07:40:33'),
(51, 'Sapang Palay Proper Elementary School', NULL, '2026-03-25 07:40:33'),
(52, 'Sta. Cruz (BBD) Elementary School', NULL, '2026-03-25 07:40:33'),
(53, 'Sto. Cristo Elementary School', NULL, '2026-03-25 07:40:33'),
(54, 'Towerville Elementary School', NULL, '2026-03-25 07:40:33'),
(55, 'Tungkong Mangga Elementary School', NULL, '2026-03-25 07:40:33'),
(56, 'Citrus National High School', NULL, '2026-03-25 07:40:33'),
(57, 'City of San Jose del Monte National Science High School', NULL, '2026-03-25 07:40:33'),
(58, 'Graceville National High School', NULL, '2026-03-25 07:40:33'),
(59, 'Kakawate National High School', NULL, '2026-03-25 07:40:33'),
(60, 'Kaypian National High School', NULL, '2026-03-25 07:40:33'),
(61, 'Marangal National High School', NULL, '2026-03-25 07:40:33'),
(62, 'Eduardo A. Abendaño National High School', NULL, '2026-03-25 07:40:33'),
(63, 'Mulawin National High School', NULL, '2026-03-25 07:40:33'),
(64, 'Muzon Harmony Hills High School', NULL, '2026-03-25 07:40:33'),
(65, 'Angelito M. Sarmiento High School', NULL, '2026-03-25 07:40:33'),
(66, 'Paradise Farms National High School', NULL, '2026-03-25 07:40:33'),
(67, 'San Isidro National High School', NULL, '2026-03-25 07:40:33'),
(68, 'San Jose del Monte Heights High School', NULL, '2026-03-25 07:40:33'),
(69, 'San Jose del Monte National High School', NULL, '2026-03-25 07:40:33'),
(70, 'San Jose del Monte National Trade School', NULL, '2026-03-25 07:40:33'),
(71, 'San Manuel National High School', NULL, '2026-03-25 07:40:33'),
(72, 'San Martin National High School', NULL, '2026-03-25 07:40:33'),
(73, 'San Rafael National High School', NULL, '2026-03-25 07:40:33'),
(74, 'Sapang Palay National High School', NULL, '2026-03-25 07:40:33'),
(75, 'Sto. Cristo National High School', NULL, '2026-03-25 07:40:33'),
(76, 'Towerville High School', NULL, '2026-03-25 07:40:33'),
(77, 'Bagong Buhay A Integrated School', NULL, '2026-03-25 07:40:33'),
(78, 'Bagong Buhay B Integrated School', NULL, '2026-03-25 07:40:33'),
(79, 'Bagong Buhay F Integrated School', NULL, '2026-03-25 07:40:33');

-- --------------------------------------------------------

--
-- Table structure for table `super_admin_schools`
--

CREATE TABLE `super_admin_schools` (
  `super_admin_id` int(11) NOT NULL,
  `school_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(75) NOT NULL,
  `last_name` varchar(75) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('SUPER_ADMIN','ADMIN','DATA_ENCODER') NOT NULL,
  `school_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `role`, `school_id`, `is_active`, `created_at`, `updated_at`) VALUES
(9, 'Shania', 'Condalor', 'shania@email.com', '$2a$10$XCCvruko7.qv1d9CJfSG0eI3FP1bnuaJXS8VU0BiIK8WYoFKntSuC', 'SUPER_ADMIN', NULL, 1, '2026-03-11 03:28:24', '2026-03-11 06:18:03'),
(10, 'Bea', 'Cortez', 'bea@email.com', '$2a$10$.e4mYQHq67gjpt6boIQPTORRIJTsDOBLhq0t2FeLRgU.gs5CU7eAS', 'DATA_ENCODER', NULL, 0, '2026-03-11 06:49:07', '2026-03-11 06:49:18'),
(12, 'Namtan', 'Tipnaree', 'namtan@email.com', '$2a$10$ISorRaDyQMk9hjTFomzzSuZd8pWsk7JLBqFYOHVrEmoYZwTTClDoO', 'DATA_ENCODER', NULL, 0, '2026-03-11 07:01:52', '2026-03-12 03:52:50'),
(17, 'Miu', 'Taechamongkalapiwat', 'shaniacondalor@gmail.com', '$2a$10$ES3rOu1co7Bz4AZIWyVb9O2ezVX.gDt6WhG12LCpjRu5yysQRhuF2', 'SUPER_ADMIN', NULL, 1, '2026-03-18 05:57:25', '2026-03-18 05:57:39'),
(20, 'Amir', 'Perez', 'amir@email.com', '$2a$10$R/gxoDEHOX//vzaQbFkTj.NACp0N5fYO2.Qvi4cVXm7GJXZ0v0hhO', 'DATA_ENCODER', NULL, 1, '2026-03-19 02:09:56', '2026-03-19 02:12:39'),
(23, 'Reg', 'User', 'tmp-reg-1774327794423@example.test', '$2a$10$gp.NMtuVz16fRfauCYajmeoO.5knzLCifd.yAQphkypGguXFX87hm', 'DATA_ENCODER', NULL, 1, '2026-03-24 04:49:54', '2026-03-24 04:49:54'),
(24, 'Love', 'Pattranite', 'love@email.com', '$2a$10$vy.TYkcRWUK1RwUDy92VquO/TXZSBf0/2WQw3PhqwnDZ1bNFuWIgy', 'DATA_ENCODER', NULL, 1, '2026-03-24 04:54:52', '2026-03-24 04:54:52'),
(25, 'Alexis', 'Torrefiel', 'alexis@email.com', '$2a$10$fENAfPufZ8ajziWpY1Abaui9kRWhmDMMHANX5ZWVZHZ.15yFFsRjK', 'DATA_ENCODER', NULL, 1, '2026-03-24 04:58:50', '2026-03-24 04:58:50'),
(26, 'Super', 'Admin', 'superadmin@deped.gov.ph', '$2a$10$NfJ0MCfNkjQg3Uv.dRP2BOvrAh5A3uN3ilSpp9DtH.vUzD6bv51jC', 'SUPER_ADMIN', NULL, 1, '2026-03-24 06:13:45', '2026-03-24 06:25:19'),
(28, 'Test', 'Admin', 'testadmin@deped.gov.ph', '$2a$10$TXjQToToqwgg7bYoTWUnIex0d1gqkI9OJGX2evOviPNSWEpxdqEPS', 'ADMIN', NULL, 1, '2026-03-24 06:25:19', '2026-03-24 06:25:19'),
(29, 'Test', 'Encoder', 'testencoder@deped.gov.ph', '$2a$10$8GO16u.mTnBJfg4RnQavouwIo72VKsnyC5n4RXUH98g0EC/c9cYie', 'DATA_ENCODER', NULL, 1, '2026-03-24 06:25:20', '2026-03-24 06:25:20'),
(30, 'Raymond', 'Bautista', 'raymond@email.com', '$2a$10$xTEQ2AQNvrph/amnURnSjOwmPwMs8cz5WoroWDOzz5m61UqaXhyta', 'ADMIN', 57, 1, '2026-03-26 01:10:59', '2026-03-26 01:10:59'),
(31, 'Bea', 'Patrice', 'bea@gmail.com', '$2a$10$Fm1is6AdbZ.Yx.pLEMuxQ.frZG0Gdxf7V1ql0rtdxY7gwoDVI7NCO', 'DATA_ENCODER', 57, 1, '2026-03-26 02:20:45', '2026-03-26 02:20:45'),
(32, 'Alexis', 'Torrefiel', 'alex@email.com', '$2a$10$aWTUcuGMwtjdxNrc9veJOOIYtKhOBM458.AX6.4dv4jJ10g6Va4kG', 'DATA_ENCODER', 57, 1, '2026-03-26 02:27:13', '2026-03-26 02:27:13'),
(33, 'Namtan', 'Tipnaree', 'tipnaree@email.com', '$2a$10$4Jv7qTZvXvPPACI/k1hCkuUuWVIFLMmckEZaYhtsJ4b64jS7gVZ5W', 'DATA_ENCODER', 69, 1, '2026-03-26 02:28:21', '2026-03-26 02:28:46');

-- --------------------------------------------------------

--
-- Table structure for table `user_token_invalidations`
--

CREATE TABLE `user_token_invalidations` (
  `user_id` int(11) NOT NULL,
  `invalid_after` datetime NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_token_invalidations`
--

INSERT INTO `user_token_invalidations` (`user_id`, `invalid_after`, `updated_at`) VALUES
(8, '2026-03-24 12:49:54', '2026-03-24 04:49:54'),
(33, '2026-03-26 10:28:46', '2026-03-26 02:28:46');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `backlogs`
--
ALTER TABLE `backlogs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_backlogs_created_at` (`created_at`),
  ADD KEY `idx_backlogs_user_id` (`user_id`),
  ADD KEY `idx_backlogs_school_id` (`school_id`),
  ADD KEY `idx_backlogs_employee_id` (`employee_id`),
  ADD KEY `idx_backlogs_leave_id` (`leave_id`),
  ADD KEY `idx_backlogs_is_archived` (`is_archived`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_employee_email` (`email`),
  ADD KEY `idx_employees_school_id` (`school_id`),
  ADD KEY `idx_employees_is_archived` (`is_archived`),
  ADD KEY `idx_employees_archived_by` (`archived_by`),
  ADD KEY `idx_employees_on_leave` (`on_leave`);

--
-- Indexes for table `leaves`
--
ALTER TABLE `leaves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_leaves_employee_id` (`employee_id`),
  ADD KEY `idx_leaves_date_of_action` (`date_of_action`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`identifier`),
  ADD KEY `idx_login_attempts_email` (`email`),
  ADD KEY `idx_login_attempts_locked_until` (`locked_until`);

--
-- Indexes for table `registration_requests`
--
ALTER TABLE `registration_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_regreq_status` (`status`),
  ADD KEY `fk_regreq_reviewed_by` (`reviewed_by`);

--
-- Indexes for table `revoked_tokens`
--
ALTER TABLE `revoked_tokens`
  ADD PRIMARY KEY (`jti`),
  ADD KEY `idx_revoked_tokens_expires_at` (`expires_at`);

--
-- Indexes for table `schools`
--
ALTER TABLE `schools`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_school_name` (`school_name`);

--
-- Indexes for table `super_admin_schools`
--
ALTER TABLE `super_admin_schools`
  ADD PRIMARY KEY (`super_admin_id`,`school_id`),
  ADD KEY `fk_sas_school` (`school_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_email` (`email`),
  ADD KEY `idx_users_school_id` (`school_id`),
  ADD KEY `idx_users_first_last_email` (`first_name`,`last_name`,`email`),
  ADD KEY `idx_users_email` (`email`);

--
-- Indexes for table `user_token_invalidations`
--
ALTER TABLE `user_token_invalidations`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_user_token_invalidations_invalid_after` (`invalid_after`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `backlogs`
--
ALTER TABLE `backlogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=162;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=210;

--
-- AUTO_INCREMENT for table `leaves`
--
ALTER TABLE `leaves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=351;

--
-- AUTO_INCREMENT for table `registration_requests`
--
ALTER TABLE `registration_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `schools`
--
ALTER TABLE `schools`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `backlogs`
--
ALTER TABLE `backlogs`
  ADD CONSTRAINT `fk_backlogs_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_backlogs_leave` FOREIGN KEY (`leave_id`) REFERENCES `leaves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_backlogs_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_backlogs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `leaves`
--
ALTER TABLE `leaves`
  ADD CONSTRAINT `fk_leaves_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `registration_requests`
--
ALTER TABLE `registration_requests`
  ADD CONSTRAINT `fk_regreq_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `super_admin_schools`
--
ALTER TABLE `super_admin_schools`
  ADD CONSTRAINT `fk_sas_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sas_user` FOREIGN KEY (`super_admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
