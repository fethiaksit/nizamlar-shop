"use client"

import React, { useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, Environment, ContactShadows, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"
import Link from "next/link"
import { useParams } from "next/navigation"

// Tişört 3D Modeli
function CinematicTshirt({
  colorHex = "#202020",
  rotationY = 0,
  scale = 7.5,
}: {
  colorHex: string
  rotationY: number
  scale: number
}) {
  const { nodes, materials } = useGLTF("/models/tshirt.glb") as any
  const meshRef = useRef<THREE.Mesh>(null)

  const tshirtMaterial = useMemo(() => {
    const mat = (materials.color as THREE.MeshStandardMaterial).clone()
    mat.color = new THREE.Color(colorHex)
    mat.roughness = 0.65
    mat.metalness = 0.05
    return mat
  }, [materials, colorHex])

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Yumuşak dönüş hareketi
      meshRef.current.rotation.y = THREE.MathUtils.damp(
        meshRef.current.rotation.y,
        rotationY,
        4,
        delta
      )
    }
  })

  return (
    <group scale={scale} position={[0, -1.2, 0]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={nodes.tshirt.geometry}
        material={tshirtMaterial}
        dispose={null}
      />
    </group>
  )
}

// 4 Aşamalı Sinematik Scroll Verileri
const SECTIONS = [
  {
    tag: "NİZAMLAR LAB",
    title: "Hayalindeki Tasarım,",
    subtitle: "Nizamlar Kalitesiyle.",
    desc: "240 GSM ağır penye pamuk ve yüksek çözünürlüklü dijital baskı teknolojisi.",
    color: "#202020",
    colorName: "Siyah (Onyx)",
    rotY: 0, // Ön yüz
  },
  {
    tag: "DTF & SERİGRAFİ",
    title: "Kusursuz Ön ve Sırt,",
    subtitle: "Sınırsız Baskı Alanı.",
    desc: "1440 DPI endüstriyel DTF veya nefes alan su bazlı serigrafi baskı teknikleri.",
    color: "#48494B",
    colorName: "Antrasit (Chalk)",
    rotY: Math.PI, // Tam sırt
  },
  {
    tag: "PREMIUM DOKU",
    title: "Doğal Ekolojik Kumaş,",
    subtitle: "Yumuşak Tuşe.",
    desc: "Önceden yıkanmış, çekme yapmayan çift iğne dikişli oversize kalıp.",
    color: "#E9DFCB",
    colorName: "Ham Ekru",
    rotY: Math.PI * 0.45, // Çaprak açı
  },
  {
    tag: "BUTİK & KURUMSAL",
    title: "İster 1 Adet,",
    subtitle: "İster 10.000 Adet.",
    desc: "Nizamlar ERP entegrasyonuyla canlı üretim takibi ve anında kargo.",
    color: "#D4AF37",
    colorName: "Gold Edition",
    rotY: Math.PI * 2, // 360 döngü tamamlandı
  },
]

export default function CinematicHero() {
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "tr"

  const [activeSection, setActiveSection] = useState(0)
  const [scrollYProgress, setScrollYProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const totalHeight = containerRef.current.scrollHeight - window.innerHeight
      const currentScroll = Math.max(0, -rect.top)
      const progress = Math.min(1, Math.max(0, currentScroll / totalHeight))

      setScrollYProgress(progress)

      const sectionIdx = Math.min(
        SECTIONS.length - 1,
        Math.floor(progress * SECTIONS.length)
      )
      setActiveSection(sectionIdx)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const currentSection = SECTIONS[activeSection] || SECTIONS[0]
  const targetRotationY =
    currentSection.rotY + scrollYProgress * Math.PI * 0.5

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#141517] text-[#F8F8F5]"
      style={{ height: "300vh" }}
    >
      {/* Sabit 3D Sahne ve İçerik Katmanı */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col justify-between p-6 small:p-12 pointer-events-none">
        {/* Arka Plan Atmosfer Işıkları */}
        <div className="absolute inset-0 bg-radial from-[#1E2024]/50 via-[#141517] to-[#0E0F11] pointer-events-none" />

        {/* 3D Canvas Sahnesi */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          >
            <PerspectiveCamera makeDefault position={[0, 0, 7.5]} fov={35} />

            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
            <directionalLight position={[-5, 4, -3]} intensity={0.8} color="#D4AF37" />
            <spotLight position={[0, 8, 2]} intensity={1.2} penumbra={0.8} />

            <Environment preset="city" />

            <CinematicTshirt
              colorHex={currentSection.color}
              rotationY={targetRotationY}
              scale={7.5}
            />

            <ContactShadows
              position={[0, -2.5, 0]}
              opacity={0.4}
              scale={10}
              blur={2.5}
              far={4}
            />
          </Canvas>
        </div>

        {/* ÜST ROZET & MARKA BİLGİSİ */}
        <div className="relative z-10 flex items-center justify-between w-full max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#E5C158] text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#E5C158] animate-pulse" />
            {currentSection.tag}
          </div>

          <div className="text-right text-xs text-[#A0A2A6]">
            <span>Renk Kartelası: </span>
            <strong className="text-[#F8F8F5]">{currentSection.colorName}</strong>
          </div>
        </div>

        {/* ORTA METİN & BAŞLIKLAR */}
        <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center gap-4 my-auto">
          <h1 className="text-3xl small:text-6xl font-extrabold tracking-tight text-[#F8F8F5] leading-tight drop-shadow-md">
            {currentSection.title}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">
              {currentSection.subtitle}
            </span>
          </h1>

          <p className="text-sm small:text-base text-[#A0A2A6] max-w-lg leading-relaxed">
            {currentSection.desc}
          </p>

          {/* Aksiyon Butonları */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pointer-events-auto">
            <Link
              href={`/${countryCode}/store`}
              className="px-8 py-3 rounded-lg font-bold bg-[#D4AF37] hover:bg-[#C49F27] text-[#141517] shadow-xl hover:shadow-2xl transition-all"
            >
              Koleksiyonu Keşfet
            </Link>
            <Link
              href={`/${countryCode}/products/premium-oversize-penye-t-shirt`}
              className="px-6 py-3 rounded-lg font-semibold border border-[#34373D] bg-[#1A1C1F]/80 hover:bg-[#25282D] text-[#F8F8F5] transition-all backdrop-blur-sm"
            >
              🎨 Kendi Tasarımını Oluştur
            </Link>
          </div>
        </div>

        {/* ALT İLERLEME ÇUBUĞU & KAYDIRMA İPUCU */}
        <div className="relative z-10 flex items-center justify-between w-full max-w-7xl mx-auto pt-4 border-t border-[#242629]/60 text-xs text-[#8E9094]">
          <div className="flex items-center gap-2">
            <span>Kaydırın & 360° İnceleyin</span>
            <span className="animate-bounce">↓</span>
          </div>

          {/* 4 Aşamalı Step Göstergesi */}
          <div className="flex items-center gap-2">
            {SECTIONS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSection === idx ? "w-8 bg-[#D4AF37]" : "w-2 bg-[#2D3035]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
